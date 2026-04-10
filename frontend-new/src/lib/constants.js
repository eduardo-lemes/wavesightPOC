export const COLORS = ['#57d6ff', '#00d4a4', '#8b7bff', '#ffaf4b', '#ff6b6b', '#7fe0a2']

export const BANDS = [
  { name: 'LW',   f0: 0.15,  f1: 0.285 },
  { name: 'MW',   f0: 0.526, f1: 1.606 },
  { name: 'FM',   f0: 87.5,  f1: 108   },
  { name: 'VHF',  f0: 174,   f1: 230   },
  { name: 'UHF',  f0: 470,   f1: 790   },
  { name: '2.4G', f0: 2400,  f1: 2500  },
]

export const GRADIENT_BTN = 'linear-gradient(135deg, #57d6ff, #00d4a4)'
export const GRADIENT_BTN_SHADOW = '0 12px 30px rgba(87,214,255,0.25)'

// ─── Limit presets (freq MHz, level dBµV) ───────────────────────────
// PRE-COMPLIANCE REFERENCE VALUES
// These limits are reference values for pre-compliance screening.
// For formal certification, consult the official published standard.
// Sources: CISPR 25:2021, CISPR 32:2015, FCC Part 15 (47 CFR §15.109)
//
// Piecewise linear: array of [freq_mhz, level_dbuv]
// PK detector assumed unless noted otherwise.

export const PRE_COMPLIANCE_DISCLAIMER = 'Valores de referência para pre-compliance. Para certificação formal, consulte a norma oficial vigente.'

export const LIMIT_PRESETS = {
  // ── CISPR 25 (Automotive) ─────────────────────────────────────────
  cispr_a: {
    label: 'CISPR 25 Class 1 — PK',
    category: 'CISPR 25',
    desc: 'Mais relaxado — uso geral',
    points: [
      [0.15, 66], [0.285, 66], [0.53, 56], [1.705, 56],
      [1.705, 46], [30, 46], [76, 38], [108, 38],
      [174, 44], [230, 44], [470, 44], [862, 44], [862, 44], [1000, 44],
    ],
  },
  cispr_c2: {
    label: 'CISPR 25 Class 2 — PK',
    category: 'CISPR 25',
    desc: 'Intermediário baixo',
    points: [
      [0.15, 56], [0.285, 56], [0.53, 46], [1.705, 46],
      [1.705, 36], [30, 36], [76, 28], [108, 28],
      [174, 34], [230, 34], [470, 34], [862, 34], [862, 34], [1000, 34],
    ],
  },
  cispr_b: {
    label: 'CISPR 25 Class 3 — PK',
    category: 'CISPR 25',
    desc: 'Automotivo padrão — mais comum',
    points: [
      [0.15, 50], [0.285, 50], [0.53, 40], [1.705, 40],
      [1.705, 30], [30, 30], [76, 22], [108, 22],
      [174, 28], [230, 28], [470, 28], [862, 28], [862, 28], [1000, 28],
    ],
  },
  cispr_c4: {
    label: 'CISPR 25 Class 4 — PK',
    category: 'CISPR 25',
    desc: 'Intermediário alto — veículos premium',
    points: [
      [0.15, 44], [0.285, 44], [0.53, 34], [1.705, 34],
      [1.705, 24], [30, 24], [76, 16], [108, 16],
      [174, 22], [230, 22], [470, 22], [862, 22], [862, 22], [1000, 22],
    ],
  },
  cispr_class5: {
    label: 'CISPR 25 Class 5 — PK',
    category: 'CISPR 25',
    desc: 'Mais restritivo — áudio/navegação',
    points: [
      [0.15, 40], [0.285, 40], [0.53, 30], [1.705, 30],
      [1.705, 20], [30, 20], [76, 12], [108, 12],
      [174, 18], [230, 18], [470, 18], [862, 18], [862, 18], [1000, 18],
    ],
  },

  // ── CISPR 32 (Multimedia Equipment) ───────────────────────────────
  cispr32_a: {
    label: 'CISPR 32 Class A — QP',
    category: 'CISPR 32',
    desc: 'Equipamento industrial/comercial',
    // Radiated emissions at 10m, QP detector
    points: [
      [30, 40], [230, 40], [230, 47], [1000, 47],
    ],
  },
  cispr32_b: {
    label: 'CISPR 32 Class B — QP',
    category: 'CISPR 32',
    desc: 'Equipamento residencial — mais restritivo',
    // Radiated emissions at 10m, QP detector
    points: [
      [30, 30], [230, 30], [230, 37], [1000, 37],
    ],
  },

  // ── FCC Part 15 (USA) ─────────────────────────────────────────────
  fcc_a: {
    label: 'FCC Part 15 Class A — QP',
    category: 'FCC',
    desc: 'Comercial/industrial (EUA)',
    // Radiated emissions at 10m (converted from 3m limits)
    points: [
      [30, 39.1], [88, 39.1], [88, 43.5], [216, 43.5],
      [216, 46.4], [960, 46.4], [960, 49.5], [1000, 49.5],
    ],
  },
  fcc_b: {
    label: 'FCC Part 15 Class B — QP',
    category: 'FCC',
    desc: 'Residencial (EUA) — mais restritivo',
    // Radiated emissions at 3m
    points: [
      [30, 40], [88, 40], [88, 43.5], [216, 43.5],
      [216, 46], [960, 46], [960, 54], [1000, 54],
    ],
  },

  // ── IEC 61000-6 (Generic) ─────────────────────────────────────────
  iec_generic: {
    label: 'IEC 61000-6-3 — QP',
    category: 'IEC',
    desc: 'Genérico residencial',
    points: [
      [0.15, 66], [0.5, 56], [0.5, 56], [5, 56],
      [5, 56], [30, 60], [30, 40], [230, 40], [230, 47], [1000, 47],
    ],
  },
  iec_industrial: {
    label: 'IEC 61000-6-4 — QP',
    category: 'IEC',
    desc: 'Genérico industrial',
    points: [
      [0.15, 79], [0.5, 73], [0.5, 73], [5, 73],
      [5, 73], [30, 73], [30, 47], [230, 47], [230, 54], [1000, 54],
    ],
  },
}

// Interpolate limit at a given frequency
export function interpolateLimit(preset, freqMhz) {
  const pts = LIMIT_PRESETS[preset]?.points
  if (!pts) return null
  if (freqMhz <= pts[0][0]) return pts[0][1]
  if (freqMhz >= pts[pts.length - 1][0]) return pts[pts.length - 1][1]
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    if (freqMhz >= x0 && freqMhz <= x1) {
      const t = (freqMhz - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return null
}
