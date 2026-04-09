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
// CISPR 25 Edition 4 — PK detector limits (most conservative, safe for pre-compliance)
// Source: CISPR 25:2021 Table A.1 (Class 1) and Table A.3 (Class 3)
// NOTE: These are PK limits. AV limits are typically 10-13 dB lower.
// Piecewise linear: array of [freq_mhz, level_dbuv]
export const LIMIT_PRESETS = {
  cispr_a: {
    label: 'CISPR 25 Class 1 — PK (relaxed)',
    // Class 1 PK limits per CISPR 25 Ed.4
    points: [
      // LW: 0.15–0.285 MHz → 66 dBµV
      [0.15,  66], [0.285, 66],
      // MW: 0.53–1.705 MHz → 56 dBµV
      [0.53,  56], [1.705, 56],
      // SW: 1.705–30 MHz → 46 dBµV
      [1.705, 46], [30,    46],
      // FM: 76–108 MHz → 38 dBµV
      [76,    38], [108,   38],
      // VHF TV: 174–230 MHz → 44 dBµV
      [174,   44], [230,   44],
      // UHF TV: 470–862 MHz → 44 dBµV
      [470,   44], [862,   44],
      // Cellular/data: 862–1000 MHz → 44 dBµV
      [862,   44], [1000,  44],
    ],
  },
  cispr_b: {
    label: 'CISPR 25 Class 3 — PK (standard automotive)',
    // Class 3 PK limits per CISPR 25 Ed.4 — most common for passenger vehicles
    points: [
      // LW: 0.15–0.285 MHz → 50 dBµV
      [0.15,  50], [0.285, 50],
      // MW: 0.53–1.705 MHz → 40 dBµV
      [0.53,  40], [1.705, 40],
      // SW: 1.705–30 MHz → 30 dBµV
      [1.705, 30], [30,    30],
      // FM: 76–108 MHz → 22 dBµV
      [76,    22], [108,   22],
      // VHF TV: 174–230 MHz → 28 dBµV
      [174,   28], [230,   28],
      // UHF TV: 470–862 MHz → 28 dBµV
      [470,   28], [862,   28],
      // Cellular/data: 862–1000 MHz → 28 dBµV
      [862,   28], [1000,  28],
    ],
  },
  cispr_class5: {
    label: 'CISPR 25 Class 5 — PK (most strict)',
    // Class 5 PK limits — used for high-end audio/navigation systems
    points: [
      [0.15,  40], [0.285, 40],
      [0.53,  30], [1.705, 30],
      [1.705, 20], [30,    20],
      [76,    12], [108,   12],
      [174,   18], [230,   18],
      [470,   18], [862,   18],
      [862,   18], [1000,  18],
    ],
  },
  iec_generic: {
    label: 'IEC 61000-6-3 (Residential)',
    // IEC 61000-6-3 quasi-peak limits for residential environments
    points: [
      [0.15, 66], [0.5,  56],
      [0.5,  56], [5,    56],
      [5,    56], [30,   60],
      [30,   40], [230,  40],
      [230,  47], [1000, 47],
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
