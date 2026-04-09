import { create } from 'zustand'

const API = '/api'

export const useStore = create((set, get) => ({
  // Auth
  token: localStorage.getItem('wavesight_token') || null,
  user: null,

  setToken: (token) => {
    localStorage.setItem('wavesight_token', token)
    set({ token })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('wavesight_token')
    set({ token: null, user: null, step: 'upload', results: null, files: [] })
  },

  // Wizard steps: 'upload' | 'params' | 'results'
  step: 'upload',
  setStep: (step) => set({ step }),

  // Files
  files: [],
  setFiles: (files) => set({ files }),
  resetWizard: () => set({ step: 'upload', files: [], results: null, error: null }),

  // Params
  params: {
    preset: 'manual',
    smoothing: 'none',
    smoothing_window: 7,
    peak_min_height: '',
    peak_min_distance: '',
    max_peaks: 200,
    freq_min: '',
    freq_max: '',
    max_points: 5000,
    limit_preset: 'none',
  },
  setParam: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: value } })),
  applyPreset: (preset) => {
    const presets = {
      manual:     {},
      lowband:    { smoothing: 'moving', smoothing_window: 11, peak_min_height: 20, peak_min_distance: 5,  freq_max: 30  },
      highband:   { smoothing: 'savgol', smoothing_window: 7,  peak_min_height: 15, peak_min_distance: 3,  freq_min: 30  },
      aggressive: { smoothing: 'none',   peak_min_height: 5,   peak_min_distance: 1, max_peaks: 500        },
    }
    set((s) => ({ params: { ...s.params, ...presets[preset], preset } }))
  },

  // Results
  results: null,
  loading: false,
  error: null,

  process: async () => {
    const { files, params, token } = get()
    if (!files.length) return
    set({ loading: true, error: null })

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}
    const appendParams = (fd) => {
      if (params.smoothing && params.smoothing !== 'none') fd.append('smoothing', params.smoothing)
      if (params.smoothing_window) fd.append('smoothing_window', params.smoothing_window)
      if (params.peak_min_height !== '') fd.append('peak_min_height', params.peak_min_height)
      if (params.peak_min_distance !== '') fd.append('peak_min_distance', params.peak_min_distance)
      if (params.max_peaks) fd.append('max_peaks', params.max_peaks)
    }

    try {
      const imageFiles = files.filter(f => /\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f.name))
      const dataFiles  = files.filter(f => !(/\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f.name)))

      // ── Only image(s) ──────────────────────────────────────────────
      if (imageFiles.length > 0 && dataFiles.length === 0) {
        const fd = new FormData()
        fd.append('file', imageFiles[0])
        appendParams(fd)
        const res = await fetch(`${API}/upload-image`, { method: 'POST', headers: authHeaders, body: fd })
        const resData = await res.json()
        if (!res.ok) {
          if (res.status === 401) get().logout()
          throw new Error(typeof resData.detail === 'string' ? resData.detail : JSON.stringify(resData.detail) || 'Erro')
        }
        // Mark as image-sourced
        resData._imageOnly = true
        set({ results: resData, step: 'results', loading: false })
        return
      }

      // ── Data files only ────────────────────────────────────────────
      if (dataFiles.length > 0 && imageFiles.length === 0) {
        const fd = new FormData()
        const multi = dataFiles.length > 1
        if (multi) dataFiles.forEach(f => fd.append('files', f))
        else fd.append('file', dataFiles[0])
        appendParams(fd)
        const endpoint = multi ? '/upload-multi' : '/upload'
        const res = await fetch(`${API}${endpoint}`, { method: 'POST', headers: authHeaders, body: fd })
        const resData = await res.json()
        if (!res.ok) {
          if (res.status === 401) get().logout()
          throw new Error(typeof resData.detail === 'string' ? resData.detail : JSON.stringify(resData.detail) || 'Erro no processamento')
        }
        set({ results: resData, step: 'results', loading: false })
        return
      }

      // ── Mixed: data + image — process in parallel, merge ──────────
      // Run both requests simultaneously
      const dataFd = new FormData()
      const multi = dataFiles.length > 1
      if (multi) dataFiles.forEach(f => dataFd.append('files', f))
      else dataFd.append('file', dataFiles[0])
      appendParams(dataFd)

      const imgFd = new FormData()
      imgFd.append('file', imageFiles[0])
      appendParams(imgFd)

      const [dataRes, imgRes] = await Promise.all([
        fetch(`${API}${multi ? '/upload-multi' : '/upload'}`, { method: 'POST', headers: authHeaders, body: dataFd }),
        fetch(`${API}/upload-image`, { method: 'POST', headers: authHeaders, body: imgFd }),
      ])

      if (!dataRes.ok) {
        if (dataRes.status === 401) get().logout()
        const err = await dataRes.json()
        throw new Error(typeof err.detail === 'string' ? err.detail : 'Erro no processamento dos dados')
      }

      const dataResult = await dataRes.json()
      let imgSeries = null
      let imgMeta = null

      if (imgRes.ok) {
        const imgResult = await imgRes.json()
        // Mark the image-extracted series clearly
        imgSeries = {
          ...imgResult,
          filename: `📷 ${imageFiles[0].name} (screenshot)`,
          _fromImage: true,
          _imageMeta: imgResult.image_metadata,
        }
        imgMeta = imgResult.image_metadata
      }

      // Merge: normalize data result to always have a series array
      const baseSeries = dataResult.series || [dataResult]
      const mergedSeries = imgSeries ? [...baseSeries, imgSeries] : baseSeries

      const merged = {
        ...dataResult,
        series: mergedSeries,
        _hasImageSeries: !!imgSeries,
        _imageMeta: imgMeta,
        // Keep revision comparison from data only (image comparison doesn't make sense)
        revision_comparison: dataResult.revision_comparison || null,
      }

      set({ results: merged, step: 'results', loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },
}))

// Central fetch with auth + 401 handling
export const authFetch = async (url, options = {}) => {
  const { token, logout } = useStore.getState()
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
  })
  if (res.status === 401) logout()
  return res
}
