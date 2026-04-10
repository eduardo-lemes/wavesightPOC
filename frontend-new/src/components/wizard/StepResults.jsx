import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useStore } from '../../store'
import { motion } from 'framer-motion'
import { ArrowLeft, RefreshCw, FileText, Printer, Image, TrendingUp, Activity, Zap, Layers, Loader2, ChevronUp, ChevronDown, Download } from 'lucide-react'
import { buildRe310TableHtml } from '../../lib/re310'
import { getPlotly } from '../../lib/plotly'
import { COLORS, BANDS, LIMIT_PRESETS, interpolateLimit } from '../../lib/constants'
import { useToast } from '../Toast'

const DARK = { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#96a3ad', family: 'IBM Plex Sans, system-ui' } }
const AXIS = { gridcolor: '#1f2a36', zerolinecolor: '#1f2a36', color: '#96a3ad' }
const MBAR_CFG = { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['select2d','lasso2d','toImage'], displaylogo: false, modeBarStyle: { bottom: 0, top: 'auto' } }

// ─── Report HTML ────────────────────────────────────────────────────
function buildReportHtml(series, imageDataUrl) {
  const ts = new Date().toLocaleString('pt-BR')
  const rows = series.map((s) => `<tr><td>${s.filename}</td><td>${s.count}</td><td>${s.stats?.min?.toFixed(2)??'—'}</td><td>${s.stats?.max?.toFixed(2)??'—'}</td><td>${s.stats?.mean?.toFixed(2)??'—'}</td><td>${s.stats?.std?.toFixed(2)??'—'}</td><td>${s.smoothing?.method&&s.smoothing.method!=='none'?`${s.smoothing.method}(${s.smoothing.window})`:'—'}</td><td>${s.emission_type??'—'}</td></tr>`).join('')
  const peakRows = (series[0]?.peaks||[]).slice(0,30).map((p,i)=>`<tr><td>${i+1}</td><td>${p.frequency?.toFixed(4)}</td><td>${p.intensity?.toFixed(2)}</td></tr>`).join('')
  const re310Html = buildRe310TableHtml(series)
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"/><title>WaveSight EMC</title>
<style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:22px;margin:0 0 6px}h2{font-size:15px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}.meta{color:#444;font-size:13px;margin-bottom:16px}table{border-collapse:collapse;width:100%;font-size:12px;margin-bottom:16px}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f2f2f2;font-weight:600}td.num{text-align:center;white-space:nowrap}img{max-width:100%;border:1px solid #ddd;margin-top:8px}.footer{margin-top:24px;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px}.cover{border:1px solid #ddd;padding:24px;margin-bottom:24px}.page-break{page-break-after:always}.re310-table{font-size:11px}.re310-table th,.re310-table td{padding:4px 6px}.re310-table th{text-align:center;background:#e6e6e6}.re310-group td{background:#d9d9d9;font-weight:700}.re310-result{font-size:11px;line-height:1.4}.result-pill{display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid #ccc;font-weight:700;font-size:11px;margin-right:6px}.result-pass{background:#e8f5e9;border-color:#a5d6a7;color:#1b5e20}.result-fail{background:#ffebee;border-color:#ef9a9a;color:#b71c1c}.result-na{background:#eee;border-color:#ccc;color:#444}.muted{color:#777;font-size:10px}@media print{@page{size:A4 landscape;margin:12mm}}</style></head><body>
<div class="cover"><h1>WaveSight EMC — Relatório</h1><div class="meta">Gerado em: ${ts}<br/>Arquivos: ${series.map(s=>s.filename).join(', ')}<br/>Séries: ${series.length}</div></div>
<div class="page-break"></div>
<h2>RE 310 Level 2</h2><div class="meta">Detector ref: PK→AV→QP, pior caso entre arquivos.</div>${re310Html}
<div class="page-break"></div>
<h2>Resumo</h2><table><thead><tr><th>Arquivo</th><th>Amostras</th><th>Min</th><th>Max</th><th>Média</th><th>Desvio</th><th>Suavização</th><th>Emissão</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Picos (top 30)</h2><table><thead><tr><th>#</th><th>Freq (MHz)</th><th>Amp (dBµV)</th></tr></thead><tbody>${peakRows||'<tr><td colspan="3">—</td></tr>'}</tbody></table>
<div class="page-break"></div><h2>Gráfico 2D</h2>${imageDataUrl?`<img src="${imageDataUrl}" alt="Gráfico"/>`:''}<div class="footer">WaveSight EMC — ${ts}</div></body></html>`
}

// ─── Helpers ────────────────────────────────────────────────────────
function estimateNoiseFloor(intensity) {
  const sorted = [...intensity].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * 0.1)] // 10th percentile
}

function getLimitTrace(preset, freqArr) {
  if (!preset || preset === 'none') return null
  const pts = LIMIT_PRESETS[preset]?.points
  if (!pts) return null
  const minF = pts[0][0], maxF = pts[pts.length - 1][0]
  const x = [], y = []
  for (const f of freqArr) {
    if (f < minF || f > maxF) continue
    const lv = interpolateLimit(preset, f)
    if (lv != null) { x.push(f); y.push(lv) }
  }
  return { x, y, type: 'scatter', mode: 'lines', name: LIMIT_PRESETS[preset].label,
    line: { color: '#ff6b6b', width: 1.5, dash: 'dash' }, hoverinfo: 'skip' }
}

function getExceedShapes(preset, freqArr, intensityArr) {
  if (!preset || preset === 'none') return []
  const shapes = []
  let inExceed = false, x0 = null
  for (let i = 0; i < freqArr.length; i++) {
    const lv = interpolateLimit(preset, freqArr[i])
    const exceeds = lv != null && intensityArr[i] > lv
    if (exceeds && !inExceed) { inExceed = true; x0 = freqArr[i] }
    if (!exceeds && inExceed) {
      shapes.push({ type: 'rect', xref: 'x', yref: 'paper', x0, x1: freqArr[i - 1], y0: 0, y1: 1, fillcolor: 'rgba(255,107,107,0.08)', line: { width: 0 } })
      inExceed = false
    }
  }
  if (inExceed) shapes.push({ type: 'rect', xref: 'x', yref: 'paper', x0, x1: freqArr[freqArr.length - 1], y0: 0, y1: 1, fillcolor: 'rgba(255,107,107,0.08)', line: { width: 0 } })
  return shapes
}

// ─── Component ──────────────────────────────────────────────────────
export default function StepResults() {
  const { results, params, setStep, files, resetWizard } = useStore()
  const toast = useToast()
  const plotRef      = useRef(null)
  const marginRef    = useRef(null)
  const waterfallRef = useRef(null)
  const histRef      = useRef(null)
  const plot3dRef    = useRef(null)

  const [mode2d, setMode2d]       = useState('lines')
  const [showPeaks, setShowPeaks] = useState(true)
  const [showBands, setShowBands] = useState(true)
  const [tab, setTab]             = useState('chart')
  const [peakSort, setPeakSort]   = useState({ col: 'intensity', dir: 'desc' })
  const [exportLoading, setExportLoading] = useState(null)
  const [focusFreq, setFocusFreq] = useState(null)

  const series       = useMemo(() => results?.series || (results ? [results] : []), [results])
  const aiInsights   = results?.ai_insights
  const revComp      = results?.revision_comparison
  const imageMeta    = results?.image_metadata || results?._imageMeta
  const hasImageSeries = results?._hasImageSeries || results?._imageOnly

  // Separate real data series from image-extracted series
  const dataSeries   = useMemo(() => series.filter(s => !s._fromImage), [series])
  const imgSeries    = useMemo(() => series.filter(s => s._fromImage),  [series])

  // Use first real data series for single-series stats/peaks/margin
  const first        = dataSeries[0] || series[0]
  const allPeaks     = first?.peaks || []
  const emissionType = first?.emission_type || results?.emission_type
  const limitPreset  = params?.limit_preset || 'none'

  // Options from params (with safe defaults — xlog off by default)
  const opt = {
    xlog:          params?.xlog          === true,   // only true if explicitly set
    showLimit:     params?.showLimit     !== false,
    colorExceed:   params?.colorExceed   !== false,
    showMargin:    params?.showMargin    !== false,
    showWaterfall: params?.showWaterfall !== false,
    showHistogram: params?.showHistogram !== false,
    showHarmonics: params?.showHarmonics !== false,
    showNoiseFloor:params?.showNoiseFloor!== false,
    showBandStats: params?.showBandStats !== false,
  }

  // PASS/FAIL — only real data series, never image-extracted
  const compliance = useMemo(() => {
    if (limitPreset === 'none') return null
    let fail = 0
    dataSeries.forEach((s) => {
      ;(s.peaks || []).forEach((p) => {
        const lv = interpolateLimit(limitPreset, p.frequency)
        if (lv != null && p.intensity > lv) fail++
      })
    })
    return fail === 0 ? 'PASS' : 'FAIL'
  }, [series, limitPreset])

  // Sorted peaks
  const sortedPeaks = useMemo(() => {
    return [...allPeaks].sort((a, b) => {
      const va = a[peakSort.col] ?? 0, vb = b[peakSort.col] ?? 0
      return peakSort.dir === 'asc' ? va - vb : vb - va
    }).slice(0, 50)
  }, [allPeaks, peakSort])

  // Band stats
  const bandStats = useMemo(() => {
    if (!first?.frequency) return []
    return BANDS.map((b) => {
      const vals = []
      for (let i = 0; i < first.frequency.length; i++) {
        if (first.frequency[i] >= b.f0 && first.frequency[i] <= b.f1) vals.push(first.intensity[i])
      }
      if (!vals.length) return null
      const min = Math.min(...vals), max = Math.max(...vals), mean = vals.reduce((a, v) => a + v, 0) / vals.length
      const lv = interpolateLimit(limitPreset, (b.f0 + b.f1) / 2)
      return { name: b.name, min, max, mean, limit: lv, margin: lv != null ? max - lv : null }
    }).filter(Boolean)
  }, [first, limitPreset])

  // Harmonics from patterns
  const harmonics = useMemo(() => {
    const h = first?.patterns?.harmonics
    if (!h) return []
    return Array.from({ length: h.count }, (_, i) => h.fundamental * (i + 1))
  }, [first])

  // ─── Main 2D plot ──────────────────────────────────────────────────
  const renderPlot = useCallback(async () => {
    if (!plotRef.current || !series.length) return
    const Plotly = await getPlotly()
    const s0 = series[0]

    const traces = series.map((s, i) => {
      const isImg = s._fromImage
      return {
        x: s.frequency, y: s.intensity, type: 'scatter',
        mode: mode2d === 'points' ? 'markers' : 'lines',
        name: s.filename || `Série ${i + 1}`,
        line: {
          color: COLORS[i % COLORS.length],
          width: isImg ? 1.5 : 1.5,
          dash: isImg ? 'dot' : 'solid',
        },
        marker: { color: COLORS[i % COLORS.length], size: 3 },
        opacity: isImg ? 0.7 : 1,
      }
    })

    if (showPeaks && allPeaks.length) {
      traces.push({ x: allPeaks.map(p => p.frequency), y: allPeaks.map(p => p.intensity),
        type: 'scatter', mode: 'markers', name: 'Picos',
        marker: { color: '#ffaf4b', size: 7, symbol: 'triangle-up' } })
    }

    if (opt.showLimit && limitPreset !== 'none' && s0) {
      const lt = getLimitTrace(limitPreset, s0.frequency)
      if (lt) traces.push(lt)
    }

    if (opt.showNoiseFloor && s0) {
      const nf = estimateNoiseFloor(s0.intensity)
      traces.push({ x: [s0.frequency[0], s0.frequency[s0.frequency.length - 1]], y: [nf, nf],
        type: 'scatter', mode: 'lines', name: 'Noise floor',
        line: { color: 'rgba(150,163,173,0.4)', width: 1, dash: 'dot' }, hoverinfo: 'skip' })
    }

    const bandShapes = showBands ? BANDS.map(b => ({
      type: 'rect', xref: 'x', yref: 'paper', x0: b.f0, x1: b.f1, y0: 0, y1: 1,
      fillcolor: 'rgba(87,214,255,0.04)', line: { width: 0 } })) : []

    const exceedShapes = (opt.colorExceed && limitPreset !== 'none' && s0)
      ? getExceedShapes(limitPreset, s0.frequency, s0.intensity) : []

    const harmonicShapes = (opt.showHarmonics && harmonics.length)
      ? harmonics.map(f => ({ type: 'line', xref: 'x', yref: 'paper', x0: f, x1: f, y0: 0, y1: 1,
          line: { color: 'rgba(140,123,255,0.35)', width: 1, dash: 'dot' } })) : []

    const focusShape = focusFreq ? [{
      type: 'line', xref: 'x', yref: 'paper', x0: focusFreq, x1: focusFreq, y0: 0, y1: 1,
      line: { color: '#57d6ff', width: 1.5 } }] : []

    const bandAnnotations = showBands ? BANDS.map(b => ({
      x: (b.f0 + b.f1) / 2, y: 1, xref: 'x', yref: 'paper', text: b.name,
      showarrow: false, font: { size: 9, color: 'rgba(87,214,255,0.5)' }, yanchor: 'top' })) : []

    const xaxis = { ...AXIS, title: 'Frequência (MHz)', type: opt.xlog ? 'log' : 'linear' }
    if (focusFreq) {
      if (opt.xlog) {
        xaxis.range = [Math.log10(focusFreq * 0.9), Math.log10(focusFreq * 1.1)]
      } else {
        xaxis.range = [focusFreq * 0.95, focusFreq * 1.05]
      }
    }

    Plotly.react(plotRef.current, traces, {
      ...DARK, xaxis, yaxis: { ...AXIS, title: 'Amplitude (dBµV)' },
      legend: {
        orientation: 'h', x: 0, y: -0.18, xanchor: 'left', yanchor: 'top',
        bgcolor: 'transparent', font: { color: '#96a3ad', size: 11 },
      },
      margin: { t: 36, r: 48, b: 80, l: 55 },
      shapes: [...bandShapes, ...exceedShapes, ...harmonicShapes, ...focusShape],
      annotations: bandAnnotations, hovermode: 'x unified',
      hoverlabel: { bgcolor: '#0f151d', bordercolor: '#1f2a36', font: { color: '#e7edf3', size: 11 } },
    }, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['select2d','lasso2d','toImage'], displaylogo: false })
  }, [series, mode2d, showPeaks, showBands, allPeaks, opt, limitPreset, harmonics, focusFreq])

  useEffect(() => { renderPlot() }, [renderPlot])

  // ─── Margin plot ───────────────────────────────────────────────────
  const renderMargin = useCallback(async () => {
    if (!marginRef.current || !first || limitPreset === 'none') return
    const Plotly = await getPlotly()
    const margins = first.frequency.map((f, i) => {
      const lv = interpolateLimit(limitPreset, f)
      return lv != null ? first.intensity[i] - lv : null
    }).filter(v => v != null)
    const freqs = first.frequency.filter((f) => interpolateLimit(limitPreset, f) != null)
    const colors = margins.map(m => m > 0 ? '#ff6b6b' : '#00d4a4')
    Plotly.react(marginRef.current, [{
      x: freqs, y: margins, type: 'scatter', mode: 'lines', name: 'Margem',
      line: { color: '#57d6ff', width: 1.5 },
      fill: 'tozeroy', fillcolor: 'rgba(87,214,255,0.06)',
    }, {
      x: [freqs[0], freqs[freqs.length - 1]], y: [0, 0],
      type: 'scatter', mode: 'lines', name: 'Limite (0 dB)',
      line: { color: '#ff6b6b', width: 1, dash: 'dash' }, hoverinfo: 'skip',
    }], {
      ...DARK, xaxis: { ...AXIS, title: 'Frequência (MHz)', type: opt.xlog ? 'log' : 'linear' },
      yaxis: { ...AXIS, title: 'Margem (dB)' },
      margin: { t: 20, r: 20, b: 50, l: 55 }, hovermode: 'x unified',
      hoverlabel: { bgcolor: '#0f151d', bordercolor: '#1f2a36', font: { color: '#e7edf3', size: 11 } },
    }, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['select2d','lasso2d','toImage'], displaylogo: false })
  }, [first, limitPreset, opt.xlog])

  // ─── Waterfall ─────────────────────────────────────────────────────
  const renderWaterfall = useCallback(async () => {
    if (!waterfallRef.current || series.length < 2) return
    const Plotly = await getPlotly()
    const minLen = Math.min(...series.map(s => s.frequency.length))
    const z = series.map(s => s.intensity.slice(0, minLen))
    const x = series[0].frequency.slice(0, minLen)
    const y = series.map((s, i) => s.filename || `Série ${i + 1}`)
    Plotly.react(waterfallRef.current, [{
      type: 'heatmap', x, y, z, colorscale: 'Turbo',
      colorbar: { title: 'dBµV', tickfont: { color: '#96a3ad' }, titlefont: { color: '#96a3ad' } },
    }], {
      ...DARK, xaxis: { ...AXIS, title: 'Frequência (MHz)' },
      yaxis: { ...AXIS, title: '' }, margin: { t: 20, r: 80, b: 50, l: 120 },
      hoverlabel: { bgcolor: '#0f151d', bordercolor: '#1f2a36', font: { color: '#e7edf3', size: 11 } },
    }, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['select2d','lasso2d','toImage'], displaylogo: false })
  }, [series])

  // ─── Histogram ─────────────────────────────────────────────────────
  const renderHistogram = useCallback(async () => {
    if (!histRef.current || !first) return
    const Plotly = await getPlotly()
    Plotly.react(histRef.current, [{
      x: first.intensity, type: 'histogram', nbinsx: 60,
      marker: { color: '#57d6ff', opacity: 0.75 }, name: 'Amplitude',
    }], {
      ...DARK, xaxis: { ...AXIS, title: 'Amplitude (dBµV)' },
      yaxis: { ...AXIS, title: 'Contagem' }, margin: { t: 20, r: 20, b: 50, l: 55 },
      bargap: 0.05,
      hoverlabel: { bgcolor: '#0f151d', bordercolor: '#1f2a36', font: { color: '#e7edf3', size: 11 } },
    }, { responsive: true, displayModeBar: true, modeBarButtonsToRemove: ['select2d','lasso2d','toImage'], displaylogo: false })
  }, [first])

  useEffect(() => { if (tab === 'margin')    renderMargin()    }, [tab, renderMargin])
  useEffect(() => { if (tab === 'waterfall') renderWaterfall() }, [tab, renderWaterfall])
  useEffect(() => { if (tab === 'histogram') renderHistogram() }, [tab, renderHistogram])

  // ─── 3D Surface / Scatter ──────────────────────────────────────────
  const render3D = useCallback(async () => {
    if (!plot3dRef.current || !series.length) return
    const Plotly = await getPlotly()
    const traces3d = series.map((s, i) => ({
      type: 'scatter3d', mode: 'lines',
      x: s.frequency, y: s.frequency.map(() => i), z: s.intensity,
      name: s.filename || `Série ${i + 1}`,
      line: { color: COLORS[i % COLORS.length], width: 2 },
    }))
    // If single series, render as surface-like using scatter3d with intensity color
    if (series.length === 1) {
      const s = series[0]
      traces3d[0] = {
        type: 'scatter3d', mode: 'lines',
        x: s.frequency, y: s.intensity, z: s.intensity,
        line: { color: s.intensity, colorscale: 'Turbo', width: 3, showscale: true,
          colorbar: { title: 'dBµV', tickfont: { color: '#96a3ad' }, titlefont: { color: '#96a3ad' } } },
        name: s.filename,
      }
    }
    Plotly.react(plot3dRef.current, traces3d, {
      ...DARK,
      scene: {
        xaxis: { ...AXIS, title: 'Frequência (MHz)' },
        yaxis: { ...AXIS, title: series.length > 1 ? 'Série' : 'Amplitude' },
        zaxis: { ...AXIS, title: 'Amplitude (dBµV)' },
        bgcolor: 'transparent',
      },
      margin: { t: 20, r: 20, b: 20, l: 20 },
      hoverlabel: { bgcolor: '#0f151d', bordercolor: '#1f2a36', font: { color: '#e7edf3', size: 11 } },
    }, { responsive: true, displayModeBar: true, displaylogo: false })
  }, [series])

  useEffect(() => { if (tab === '3d') render3D() }, [tab, render3D])

  // ─── Exports ───────────────────────────────────────────────────────
  const getChartImage = useCallback(async () => {
    if (!plotRef.current) return null
    const Plotly = await getPlotly()
    return Plotly.toImage(plotRef.current, { format: 'png', width: 1600, height: 900 })
  }, [])

  const exportHTML = async () => {
    setExportLoading('html')
    try {
      const dataUrl = await getChartImage()
      const blob = new Blob([buildReportHtml(series, dataUrl)], { type: 'text/html;charset=utf-8' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wavesight-relatorio.html'; a.click()
      toast('Relatório HTML baixado', 'ok')
    } catch { toast('Falha ao gerar HTML', 'error') } finally { setExportLoading(null) }
  }

  const exportPDF = async () => {
    setExportLoading('pdf')
    try {
      // Try native PDF from backend first (if report was saved)
      const reportId = results?.report_id
      if (reportId) {
        const res = await fetch(`/api/analyses/${reportId}/pdf`, {
          headers: useStore.getState().token ? { Authorization: `Bearer ${useStore.getState().token}` } : {},
        })
        if (res.ok) {
          const blob = await res.blob()
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wavesight-relatorio.pdf'; a.click()
          toast('PDF baixado', 'ok')
          setExportLoading(null)
          return
        }
      }
      // Fallback: browser print
      const dataUrl = await getChartImage()
      const win = window.open('', '_blank')
      if (!win) { toast('Pop-up bloqueado', 'error'); return }
      win.document.write(buildReportHtml(series, dataUrl)); win.document.close(); win.focus()
      setTimeout(() => win.print(), 800)
      toast('Janela de impressão aberta', 'ok')
    } catch { toast('Falha ao gerar PDF', 'error') } finally { setExportLoading(null) }
  }

  const exportImage = async () => {
    setExportLoading('image')
    try {
      const dataUrl = await getChartImage()
      if (!dataUrl) throw new Error()
      const a = document.createElement('a'); a.href = dataUrl; a.download = 'wavesight-grafico.png'; a.click()
      toast('Imagem baixada', 'ok')
    } catch { toast('Falha ao exportar imagem', 'error') } finally { setExportLoading(null) }
  }

  const exportPeaksCSV = () => {
    const rows = ['Frequência (MHz),Amplitude (dBµV)', ...allPeaks.map(p => `${p.frequency},${p.intensity}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'picos.csv'; a.click()
    toast('CSV de picos baixado', 'ok')
  }

  // ─── UI helpers ────────────────────────────────────────────────────
  const toggleSort = (col) => setPeakSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' })
  const SortIcon = ({ col }) => peakSort.col !== col
    ? <ChevronUp size={11} className="opacity-20" />
    : peakSort.dir === 'asc' ? <ChevronUp size={11} className="text-accent" /> : <ChevronDown size={11} className="text-accent" />

  const ExportBtn = ({ id, label, Icon, onClick }) => (
    <button onClick={onClick} disabled={!!exportLoading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1f2a36] text-muted hover:text-white hover:border-white/20 transition-all text-sm disabled:opacity-50">
      {exportLoading === id ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {label}
    </button>
  )

  const kpis = [
    { label: 'Picos detectados', value: allPeaks.length, Icon: TrendingUp, color: 'text-accent',
      tooltip: 'Quantidade de picos de emissão encontrados no espectro. Cada pico é uma frequência onde a intensidade se destaca acima do ruído.' },
    { label: 'Amplitude máx', value: first?.stats?.max != null ? `${first.stats.max.toFixed(1)} dBµV` : '—', Icon: Activity, color: 'text-[#ffaf4b]',
      tooltip: 'Maior valor de intensidade medido em todo o espectro (em dBµV). Quanto maior, mais forte a emissão naquela frequência.' },
    { label: 'Tipo de emissão', value: emissionType || '—', Icon: Zap, color: 'text-[#8b7bff]',
      tooltip: 'Classificação automática: narrowband = picos isolados (ex: clock), broadband = ruído espalhado (ex: chaveamento), mixed = ambos, indeterminate = inconclusivo.' },
    { label: compliance ? 'Compliance' : 'Séries', value: compliance || series.length,
      Icon: Layers, color: compliance === 'PASS' ? 'text-[#00d4a4]' : compliance === 'FAIL' ? 'text-red-400' : 'text-[#00d4a4]',
      tooltip: compliance ? 'Resultado geral: PASS = todas as emissões abaixo do limite da norma. FAIL = pelo menos uma emissão acima do limite.' : 'Quantidade de arquivos/séries carregados nesta análise.' },
  ]

  // Build tabs dynamically based on options
  // RE310 and Margin only use real data series — image data is not precise enough
  const TABS = [
    ['chart', 'Gráfico 2D'],
    ...(opt.showMargin && limitPreset !== 'none' && dataSeries.length > 0 ? [['margin', 'Margem']] : []),
    ...(opt.showWaterfall && series.length > 1 ? [['waterfall', 'Waterfall']] : []),
    ...(opt.showHistogram ? [['histogram', 'Histograma']] : []),
    ['3d', '3D'],
    ['peaks', 'Picos'],
    ...(opt.showBandStats ? [['bands', 'Bandas']] : []),
    ...(dataSeries.length > 0 ? [['re310', 'RE310']] : []),
    ['ai', 'IA Insights'],
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, Icon, color, tooltip }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            title={tooltip}
            className="flex flex-col gap-2 p-4 rounded-2xl border border-[#1f2a36] bg-panel cursor-help group relative">
            <div className="flex items-center gap-2">
              <Icon size={14} className={color} />
              <span className="text-xs text-muted">{label}</span>
              <span className="text-[10px] text-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">ⓘ</span>
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            {tooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#0f151d] border border-[#1f2a36] text-xs text-muted leading-relaxed w-64 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                {tooltip}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pre-compliance disclaimer */}
      {(compliance || limitPreset !== 'none') && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1f2a36] text-[10px] text-muted bg-panel">
          <span>⚠️</span>
          <span>Análise de pre-compliance — valores de referência para preparação. Para certificação formal, consulte a norma oficial vigente e utilize receptor EMC com detector correto.</span>
        </div>
      )}

      {/* Image metadata banner */}
      {imageMeta && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[#8b7bff]/20 text-xs"
          style={{ background: 'rgba(140,123,255,0.06)' }}>
          <span className="text-[#8b7bff] font-semibold">📷 Screenshot detectada</span>
          {imageMeta.trace_used && <span className="text-muted">Trace: <span className="text-white">{imageMeta.trace_used}</span></span>}
          {imageMeta.rbw_khz   && <span className="text-muted">RBW: <span className="text-white">{imageMeta.rbw_khz} kHz</span></span>}
          {imageMeta.vbw_khz   && <span className="text-muted">VBW: <span className="text-white">{imageMeta.vbw_khz} kHz</span></span>}
          {imageMeta.swt_s     && <span className="text-muted">SWT: <span className="text-white">{imageMeta.swt_s}s</span></span>}
          {imageMeta.converted_to_dbuv && (
            <span className="text-muted">Convertido: <span className="text-white">{imageMeta.unit_original} → dBµV ({imageMeta.impedance_ohm}Ω)</span></span>
          )}
          {imageMeta.date && <span className="text-muted">Data: <span className="text-white">{imageMeta.date}</span></span>}
          {imageMeta.traces_available?.length > 1 && (
            <span className="text-muted">Traces disponíveis: <span className="text-white">{imageMeta.traces_available.join(', ')}</span></span>
          )}
        </motion.div>
      )}

      {/* Series legend */}
      {series.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {series.map((s, i) => (
            <span key={i} className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border bg-chip
              ${s._fromImage ? 'border-[#8b7bff]/30' : 'border-[#1f2a36]'}`}>
              <span className="w-2 h-2 rounded-full flex-none" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate max-w-[180px]">{s.filename}</span>
              {s._fromImage && (
                <span className="text-[#8b7bff] font-medium ml-0.5">· aprox.</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Image accuracy disclaimer — only when image series present */}
      {hasImageSeries && series.some(s => s._fromImage) && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#8b7bff]/20 text-xs"
          style={{ background: 'rgba(140,123,255,0.05)' }}>
          <span className="text-[#8b7bff] flex-none text-base">📷</span>
          <div className="text-muted leading-relaxed">
            A série marcada como <span className="text-[#8b7bff]">aprox.</span> foi extraída de uma screenshot e tem precisão de <span className="text-white">±2–5 dB</span>. Não use para conformidade formal — apenas para comparação visual. Para dados precisos, exporte o CSV diretamente do equipamento.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-[#1f2a36] bg-chip w-fit flex-wrap">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Chart 2D */}
      {tab === 'chart' && (
        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input text-xs py-1.5 w-auto" value={mode2d} onChange={(e) => setMode2d(e.target.value)}>
              <option value="lines">Curvas</option>
              <option value="points">Pontos</option>
              <option value="lines+markers">Curvas + pontos</option>
            </select>
            {[['showPeaks', showPeaks, setShowPeaks, 'Picos'], ['showBands', showBands, setShowBands, 'Bandas']].map(([, val, set, lbl]) => (
              <label key={lbl} className="flex items-center gap-2 text-xs text-muted cursor-pointer">
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="accent-accent" /> {lbl}
              </label>
            ))}
            {focusFreq && (
              <button onClick={() => setFocusFreq(null)} className="text-xs text-accent hover:underline">
                Zoom: {focusFreq.toFixed(2)} MHz ✕
              </button>
            )}
          </div>
          <div ref={plotRef} className="w-full h-[420px]" />
        </div>
      )}

      {/* Margin */}
      {tab === 'margin' && (
        <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <p className="text-xs text-muted">Margem ao limite ({LIMIT_PRESETS[limitPreset]?.label}). Valores positivos = excedência.</p>
          <div ref={marginRef} className="w-full h-[380px]" />
        </div>
      )}

      {/* Waterfall */}
      {tab === 'waterfall' && (
        <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <p className="text-xs text-muted">Heatmap de intensidade por série — frequência × arquivo.</p>
          <div ref={waterfallRef} className="w-full h-[380px]" />
        </div>
      )}

      {/* Histogram */}
      {tab === 'histogram' && (
        <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <p className="text-xs text-muted">Distribuição das amplitudes medidas.</p>
          <div ref={histRef} className="w-full h-[380px]" />
        </div>
      )}

      {/* 3D */}
      {tab === '3d' && (
        <div className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <p className="text-xs text-muted">
            {series.length === 1
              ? 'Visualização 3D com intensidade colorida (Turbo). Arraste para rotacionar.'
              : 'Comparação 3D entre séries. Cada série ocupa um plano no eixo Y.'}
          </p>
          <div ref={plot3dRef} className="w-full h-[500px]" />
        </div>
      )}

      {/* Peaks */}
      {tab === 'peaks' && (
        <div className="rounded-2xl border border-[#1f2a36] bg-panel overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f2a36]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{allPeaks.length} picos — clique na frequência para zoom</span>
              {first?._fromImage && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#8b7bff]/10 text-[#8b7bff]">📷 aprox. ±2–5 dB</span>
              )}
            </div>
            <button onClick={exportPeaksCSV} className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
              <Download size={12} /> CSV
            </button>
          </div>          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2a36]">
                <th className="text-left px-4 py-3 text-xs text-muted font-medium">#</th>
                {[['frequency','Frequência (MHz)'],['intensity','Amplitude (dBµV)']].map(([col, lbl]) => (
                  <th key={col} className="text-left px-4 py-3 text-xs text-muted font-medium cursor-pointer hover:text-white"
                    onClick={() => toggleSort(col)}>
                    <span className="flex items-center gap-1">{lbl} <SortIcon col={col} /></span>
                  </th>
                ))}
                {limitPreset !== 'none' && <th className="text-left px-4 py-3 text-xs text-muted font-medium">Margem (dB)</th>}
              </tr>
            </thead>
            <tbody>
              {sortedPeaks.map((p, i) => {
                const lv = interpolateLimit(limitPreset, p.frequency)
                const margin = lv != null ? p.intensity - lv : null
                return (
                  <tr key={i} className="border-b border-[#1f2a36]/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => { setFocusFreq(p.frequency); setTab('chart') }}>
                    <td className="px-4 py-2.5 text-muted text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-accent">{p.frequency?.toFixed(4)}</td>
                    <td className="px-4 py-2.5 font-mono">{p.intensity?.toFixed(2)}</td>
                    {limitPreset !== 'none' && (
                      <td className={`px-4 py-2.5 font-mono text-xs ${margin > 0 ? 'text-red-400' : 'text-[#00d4a4]'}`}>
                        {margin != null ? `${margin > 0 ? '+' : ''}${margin.toFixed(1)}` : '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
              {allPeaks.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted text-sm">Nenhum pico detectado</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Band stats */}
      {tab === 'bands' && (
        <div className="rounded-2xl border border-[#1f2a36] bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2a36]">
                {['Banda','Min (dBµV)','Max (dBµV)','Média (dBµV)', limitPreset !== 'none' ? 'Limite' : null, limitPreset !== 'none' ? 'Margem' : null].filter(Boolean).map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bandStats.map((b) => (
                <tr key={b.name} className="border-b border-[#1f2a36]/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-medium text-accent">{b.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{b.min.toFixed(1)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{b.max.toFixed(1)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{b.mean.toFixed(1)}</td>
                  {limitPreset !== 'none' && <td className="px-4 py-2.5 font-mono text-xs text-muted">{b.limit?.toFixed(1) ?? '—'}</td>}
                  {limitPreset !== 'none' && (
                    <td className={`px-4 py-2.5 font-mono text-xs ${b.margin > 0 ? 'text-red-400' : 'text-[#00d4a4]'}`}>
                      {b.margin != null ? `${b.margin > 0 ? '+' : ''}${b.margin.toFixed(1)}` : '—'}
                    </td>
                  )}
                </tr>
              ))}
              {bandStats.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">Sem dados nas bandas</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* RE310 */}
      {tab === 're310' && (
        <div className="rounded-2xl border border-[#1f2a36] bg-panel overflow-x-auto p-4">
          <p className="text-xs text-muted mb-3">RE310 Level 2 — detector ref: PK→AV→QP.</p>
          {imgSeries.length > 0 && (
            <p className="text-xs text-[#8b7bff] bg-[#8b7bff]/08 border border-[#8b7bff]/20 rounded-lg px-3 py-2 mb-3"
              style={{ background: 'rgba(140,123,255,0.06)' }}>
              📷 Séries extraídas de screenshot foram excluídas desta avaliação — precisão insuficiente para conformidade.
            </p>
          )}
          <div dangerouslySetInnerHTML={{ __html: buildRe310TableHtml(dataSeries) }} />
          <style>{`.re310-table{border-collapse:collapse;width:100%;font-size:11px}.re310-table th,.re310-table td{border:1px solid #1f2a36;padding:5px 8px;text-align:left;color:#e7edf3}.re310-table th{background:#0f151d;color:#96a3ad;text-align:center}.re310-group td{background:#1f2a36;font-weight:700}.re310-result{font-size:11px;line-height:1.5}.result-pill{display:inline-block;padding:1px 7px;border-radius:999px;font-weight:700;font-size:10px;margin-right:4px}.result-pass{background:rgba(0,212,164,0.15);border:1px solid rgba(0,212,164,0.3);color:#00d4a4}.result-fail{background:rgba(255,107,107,0.15);border:1px solid rgba(255,107,107,0.3);color:#ff6b6b}.result-na{background:rgba(150,163,173,0.1);border:1px solid #1f2a36;color:#96a3ad}.muted{color:#96a3ad;font-size:10px}`}</style>
        </div>
      )}

      {/* AI */}
      {tab === 'ai' && (
        <div className="p-5 rounded-2xl border border-accent/15"
          style={{ background: 'linear-gradient(135deg, rgba(87,214,255,0.04), rgba(140,123,255,0.03))' }}>
          {aiInsights
            ? <div className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{aiInsights}</div>
            : <div className="text-center py-8 text-muted text-sm">
                <div className="text-3xl mb-3">🤖</div>
                Configure <code className="bg-accent/10 px-1.5 py-0.5 rounded text-accent text-xs">AI_PROVIDER</code> e{' '}
                <code className="bg-accent/10 px-1.5 py-0.5 rounded text-accent text-xs">AI_API_KEY</code> no servidor.
              </div>}
        </div>
      )}

      {/* Revision comparison */}
      {revComp && (
        <div className="p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="text-sm font-semibold mb-3">📊 Comparação entre revisões</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {[['Novas emissões', revComp.new_emissions, 'text-red-400'],
              ['Removidas', revComp.removed_emissions, 'text-[#00d4a4]'],
              ['Deltas significativos', revComp.significant_deltas, 'text-[#ffaf4b]']].map(([lbl, items, color]) => (
              <div key={lbl}>
                <div className="text-muted mb-2">{lbl}</div>
                {!(items?.length) ? <div className="text-muted">—</div>
                  : items.map((e, i) => <div key={i} className={color}>{e.freq_mhz?.toFixed(3)} MHz{e.delta_db != null ? ` (${e.delta_db?.toFixed(1)} dB)` : ''}</div>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => setStep('params')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#1f2a36] text-muted hover:text-white hover:border-white/20 transition-all text-sm">
          <ArrowLeft size={14} /> Ajustar parâmetros
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportBtn id="html"  label="HTML"   Icon={FileText} onClick={exportHTML}  />
          <ExportBtn id="pdf"   label="PDF Relatório" Icon={Download} onClick={exportPDF} />
          <ExportBtn id="image" label="Imagem" Icon={Image}    onClick={exportImage} />
          <button onClick={resetWizard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1f2a36] text-muted hover:text-white hover:border-white/20 transition-all text-sm">
            <RefreshCw size={14} /> Nova análise
          </button>
        </div>
      </div>
    </div>
  )
}
