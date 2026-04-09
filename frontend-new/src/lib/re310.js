// RE310 Level 2 Requirements — ported from the original frontend

export const RE310_REQUIREMENTS = [
  { type: 'group', label: 'Broadcast Services' },
  { type: 'row', id: 'BS-01', description: 'LW',           min: 0.15,  max: 0.285,  pk: null,                    av: { bw_khz: 9,    limit: 36 }, qp: { bw_khz: 9,   limit: 43 } },
  { type: 'row', id: 'BS-02', description: 'MW',           min: 0.53,  max: 1.7,    pk: null,                    av: { bw_khz: 9,    limit: 12 }, qp: { bw_khz: 9,   limit: 30 } },
  { type: 'row', id: 'BS-03', description: 'SW',           min: 1.7,   max: 30,     pk: null,                    av: { bw_khz: 9,    limit: 12 }, qp: { bw_khz: 9,   limit: 24 } },
  { type: 'row', id: 'BS-04', description: 'FM 1',         min: 75,    max: 91,     pk: { bw_khz: 9,  limit: 18 }, av: { bw_khz: 9,  limit: 12 }, qp: { bw_khz: 120, limit: 24 } },
  { type: 'row', id: 'BS-05', description: 'FM 2',         min: 86,    max: 108,    pk: { bw_khz: 9,  limit: 18 }, av: { bw_khz: 9,  limit: 12 }, qp: { bw_khz: 120, limit: 24 } },
  { type: 'group', label: 'Digital Broadcast Services' },
  { type: 'row', id: 'DB-01', description: 'DAB III / TV Band III', min: 167,  max: 245,  pk: { bw_khz: 1000, limit: 32 }, av: { bw_khz: 1000, limit: 22 }, qp: null },
  { type: 'row', id: 'DB-02', description: 'TV Band IV/V',          min: 470,  max: 890,  pk: { bw_khz: 1000, limit: 38 }, av: { bw_khz: 1000, limit: 28 }, qp: null },
  { type: 'row', id: 'DB-03', description: 'DAB L Band',            min: 1447, max: 1494, pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'row', id: 'DB-04', description: 'SDARS',                 min: 2320, max: 2345, pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'group', label: 'Mobile Services' },
  { type: 'row', id: 'MS-01', description: '4m',              min: 68,   max: 88,   pk: { bw_khz: 9,    limit: 18 }, av: { bw_khz: 9,    limit: 12 }, qp: { bw_khz: 120, limit: 24 } },
  { type: 'row', id: 'MS-02', description: '2m',              min: 140,  max: 176,  pk: { bw_khz: 9,    limit: 18 }, av: { bw_khz: 9,    limit: 12 }, qp: { bw_khz: 120, limit: 24 } },
  { type: 'row', id: 'MS-03', description: 'RKE & TPMS 1',   min: 310,  max: 320,  pk: { bw_khz: 9,    limit: 20 }, av: { bw_khz: 9,    limit: 14 }, qp: null },
  { type: 'row', id: 'MS-04', description: 'TETRA',           min: 380,  max: 424,  pk: { bw_khz: 9,    limit: 25 }, av: { bw_khz: 9,    limit: 19 }, qp: null },
  { type: 'row', id: 'MS-05', description: 'RKE & TPMS 2',   min: 425,  max: 439,  pk: { bw_khz: 9,    limit: 25 }, av: { bw_khz: 9,    limit: 19 }, qp: null },
  { type: 'row', id: 'MS-06', description: 'Police (Europe)', min: 440,  max: 470,  pk: { bw_khz: 9,    limit: 25 }, av: { bw_khz: 9,    limit: 19 }, qp: null },
  { type: 'row', id: 'MS-07', description: 'RKE',             min: 868,  max: 870,  pk: { bw_khz: 9,    limit: 30 }, av: { bw_khz: 9,    limit: 24 }, qp: null },
  { type: 'row', id: 'MS-08', description: 'RKE',             min: 902,  max: 904,  pk: { bw_khz: 9,    limit: 30 }, av: { bw_khz: 9,    limit: 24 }, qp: null },
  { type: 'row', id: 'MS-09', description: '4G',              min: 703,  max: 821,  pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'row', id: 'MS-10', description: 'GSM 850',         min: 859,  max: 895,  pk: { bw_khz: 120,  limit: 32 }, av: { bw_khz: 120,  limit: 12 }, qp: null },
  { type: 'row', id: 'MS-11', description: 'GSM 900',         min: 915,  max: 960,  pk: { bw_khz: 120,  limit: 32 }, av: { bw_khz: 120,  limit: 12 }, qp: null },
  { type: 'row', id: 'MS-12', description: 'GPS',             min: 1567, max: 1583, pk: null,                         av: { bw_khz: 9,    limit: 10 }, qp: null },
  { type: 'row', id: 'MS-13', description: 'GLONASS GPS',     min: 1585, max: 1616, pk: null,                         av: { bw_khz: 9,    limit: 10 }, qp: null },
  { type: 'row', id: 'MS-14', description: 'GSM 1800',        min: 1805, max: 1880, pk: { bw_khz: 120,  limit: 34 }, av: { bw_khz: 120,  limit: 14 }, qp: null },
  { type: 'row', id: 'MS-15', description: 'GSM 1900',        min: 1930, max: 1995, pk: { bw_khz: 120,  limit: 34 }, av: { bw_khz: 120,  limit: 14 }, qp: null },
  { type: 'row', id: 'MS-16', description: '3G',              min: 1900, max: 2170, pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'row', id: 'MS-17', description: 'WiFi / Bluetooth',min: 2400, max: 2496, pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'row', id: 'MS-18', description: '4G',              min: 2496, max: 2690, pk: { bw_khz: 1000, limit: 46 }, av: { bw_khz: 1000, limit: 36 }, qp: null },
  { type: 'row', id: 'MS-19', description: 'WiFi',            min: 4915, max: 5825, pk: { bw_khz: 1000, limit: 56 }, av: { bw_khz: 1000, limit: 46 }, qp: null },
  { type: 'row', id: 'MS-20', description: 'ITS',             min: 5875, max: 5905, pk: { bw_khz: 1000, limit: 56 }, av: { bw_khz: 1000, limit: 46 }, qp: null },
]

function fmt(v, d = 2) {
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toFixed(d)
}

function analyzeRange(s, min, max, limitValue) {
  let count = 0, sum = 0, maxVal = -Infinity, maxFreq = null, exceedances = 0, maxMargin = -Infinity
  for (let i = 0; i < s.frequency.length; i++) {
    const f = s.frequency[i]
    if (f < min || f > max) continue
    const v = s.intensity[i]
    count++; sum += v
    if (v > maxVal) { maxVal = v; maxFreq = f }
    if (limitValue != null) {
      const m = v - limitValue
      if (m > 0) exceedances++
      if (m > maxMargin) maxMargin = m
    }
  }
  if (!count) return { hasData: false }
  const topPeaks = [...(s.peaks || [])]
    .filter(p => p.frequency >= min && p.frequency <= max)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3)
  return {
    hasData: true, count, mean: sum / count,
    max: maxVal, maxFreq,
    margin: limitValue != null ? maxVal - limitValue : null,
    exceedances: limitValue != null ? exceedances : null,
    maxMargin: limitValue != null ? maxMargin : null,
    topPeaks,
  }
}

function buildResultCell(req, series) {
  const det = req.pk?.limit != null ? 'pk' : req.av?.limit != null ? 'av' : req.qp?.limit != null ? 'qp' : null
  if (!det) return '<span class="result-pill result-na">N/A</span>'

  const limitValue = req[det].limit
  let worst = null, worstFile = ''
  series.forEach((s) => {
    const a = analyzeRange(s, req.min, req.max, limitValue)
    if (!a.hasData) return
    if (!worst || a.max > worst.max) { worst = a; worstFile = s.filename }
  })
  if (!worst) return '—'

  const status = worst.margin == null ? 'N/A' : worst.margin <= 0 ? 'PASS' : 'FAIL'
  const cls = status === 'PASS' ? 'result-pass' : status === 'FAIL' ? 'result-fail' : 'result-na'

  const margins = [
    req.pk?.limit != null ? `PK ${fmt(worst.max - req.pk.limit, 1)} dB` : null,
    req.av?.limit != null ? `AV ${fmt(worst.max - req.av.limit, 1)} dB` : null,
    req.qp?.limit != null ? `QP ${fmt(worst.max - req.qp.limit, 1)} dB` : null,
  ].filter(Boolean).join(' | ')

  const peaksLine = worst.topPeaks.length
    ? worst.topPeaks.map(p => `${fmt(p.frequency, 2)}: ${fmt(p.intensity, 1)}`).join(', ')
    : '—'

  return `
    <div class="re310-result">
      <div><span class="result-pill ${cls}">${status}</span> <span class="muted">ref: ${det.toUpperCase()}</span></div>
      <div>Max: <strong>${fmt(worst.max, 1)}</strong> @ <strong>${fmt(worst.maxFreq, 2)}</strong> MHz</div>
      <div>Limite (${det.toUpperCase()}): ${limitValue} → margem ${fmt(worst.margin, 1)} dB | exced.: ${worst.exceedances ?? '—'}</div>
      ${margins ? `<div>Margens: ${margins}</div>` : ''}
      <div>Arquivo: ${worstFile}</div>
      <div>Top picos: ${peaksLine}</div>
    </div>`.trim()
}

export function buildRe310TableHtml(series) {
  if (!series?.length) return ''

  // IMPORTANT: CSV data is assumed to be PK detector values (most common from spectrum analyzers).
  // When comparing against AV or QP limits, this is conservative (more restrictive than necessary).
  // For formal compliance, use an EMC receiver with the correct detector.
  const disclaimer = `<p style="font-size:10px;color:#96a3ad;margin-bottom:8px;">
    ⚠️ Dados assumidos como detector PK. Comparação contra limites AV/QP é conservadora (pre-compliance).
    Para conformidade formal, use receptor EMC com detector correto.
  </p>`

  const header = `
    <thead>
      <tr>
        <th rowspan="2">ID</th>
        <th rowspan="2">Banda</th>
        <th rowspan="2">Faixa (MHz)</th>
        <th colspan="2">PK</th>
        <th colspan="2">AV</th>
        <th colspan="2">QP</th>
        <th rowspan="2">Resultado</th>
      </tr>
      <tr>
        <th>BW (kHz)</th><th>Lim (dBµV)</th>
        <th>BW (kHz)</th><th>Lim (dBµV)</th>
        <th>BW (kHz)</th><th>Lim (dBµV)</th>
      </tr>
    </thead>`

  const rows = RE310_REQUIREMENTS.map((req) => {
    if (req.type === 'group') return `<tr class="re310-group"><td colspan="10">${req.label}</td></tr>`
    return `
      <tr>
        <td><strong>${req.id}</strong></td>
        <td>${req.description}</td>
        <td>${fmt(req.min, 2)}–${fmt(req.max, 2)}</td>
        <td class="num">${req.pk?.bw_khz ?? '—'}</td>
        <td class="num">${req.pk?.limit ?? '—'}</td>
        <td class="num">${req.av?.bw_khz ?? '—'}</td>
        <td class="num">${req.av?.limit ?? '—'}</td>
        <td class="num">${req.qp?.bw_khz ?? '—'}</td>
        <td class="num">${req.qp?.limit ?? '—'}</td>
        <td>${buildResultCell(req, series)}</td>
      </tr>`.trim()
  }).join('\n')

  return `${disclaimer}<table class="re310-table"><${header}<tbody>${rows}</tbody></table>`
}
