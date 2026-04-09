import React from 'react'
import { useStore } from '../../store'
import { motion } from 'framer-motion'
import { ArrowLeft, Zap, Loader2 } from 'lucide-react'

const PRESETS = [
  { id: 'manual',     label: 'Manual',      desc: 'Configure tudo manualmente', color: 'rgba(150,163,173,0.15)' },
  { id: 'lowband',    label: 'Banda Baixa', desc: 'Otimizado para 0–30 MHz',    color: 'rgba(87,214,255,0.12)'  },
  { id: 'highband',   label: 'Banda Alta',  desc: 'Otimizado para 30 MHz+',     color: 'rgba(140,123,255,0.12)' },
  { id: 'aggressive', label: 'Agressivo',   desc: 'Detecta o máximo de picos',  color: 'rgba(255,175,75,0.12)'  },
]

const Toggle = ({ label, hint, checked, onChange }) => (
  <label className="flex items-center justify-between gap-3 cursor-pointer group">
    <div>
      <div className="text-sm text-white/80 group-hover:text-white transition-colors">{label}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
    <div onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-none ${checked ? 'bg-accent/80' : 'bg-[#1f2a36]'}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  </label>
)

export default function StepParams() {
  const { params, setParam, applyPreset, setStep, process, loading, error, files } = useStore()
  const tog = (key, def = true) => setParam(key, !(params[key] ?? def))

  return (
    <div className="flex flex-col gap-8">

      {/* Presets */}
      <div>
        <div className="text-xs text-muted uppercase tracking-widest mb-3">Preset rápido</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PRESETS.map(({ id, label, desc, color }) => (
            <motion.button key={id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => applyPreset(id)}
              className={`flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all
                ${params.preset === id ? 'border-accent/40 text-white' : 'border-[#1f2a36] text-white/70 hover:border-white/20'}`}
              style={{ background: params.preset === id ? color : 'rgba(15,21,29,0.5)' }}>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-muted">{desc}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Smoothing */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="text-sm font-semibold">Suavização</div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted">Método</label>
            <select className="input" value={params.smoothing} onChange={(e) => setParam('smoothing', e.target.value)}>
              <option value="none">Nenhuma</option>
              <option value="moving">Média móvel</option>
              <option value="savgol">Savitzky-Golay</option>
            </select>
          </div>
          {params.smoothing !== 'none' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Janela</label>
              <input className="input" type="number" min="3" value={params.smoothing_window}
                onChange={(e) => setParam('smoothing_window', +e.target.value)} />
            </div>
          )}
        </div>

        {/* Peak detection */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="text-sm font-semibold">Detecção de picos</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Altura mín (dBµV)</label>
              <input className="input" type="number" step="0.1" placeholder="auto" value={params.peak_min_height}
                onChange={(e) => setParam('peak_min_height', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Distância mín (pts)</label>
              <input className="input" type="number" min="1" placeholder="auto" value={params.peak_min_distance}
                onChange={(e) => setParam('peak_min_distance', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Máx picos</label>
              <input className="input" type="number" min="10" value={params.max_peaks}
                onChange={(e) => setParam('max_peaks', +e.target.value)} />
            </div>
          </div>
        </div>

        {/* Frequency range */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="text-sm font-semibold">Faixa de frequência</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Freq mín (MHz)</label>
              <input className="input" type="number" step="0.1" placeholder="auto" value={params.freq_min}
                onChange={(e) => setParam('freq_min', e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted">Freq máx (MHz)</label>
              <input className="input" type="number" step="0.1" placeholder="auto" value={params.freq_max}
                onChange={(e) => setParam('freq_max', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Limits */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
          <div className="text-sm font-semibold">Limite / Norma</div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted">Preset de limite</label>
            <select className="input" value={params.limit_preset} onChange={(e) => setParam('limit_preset', e.target.value)}>
              <option value="none">Nenhum</option>
              <option value="cispr_a">CISPR 25 Class 1 — PK (relaxado)</option>
              <option value="cispr_b">CISPR 25 Class 3 — PK (automotivo padrão)</option>
              <option value="cispr_class5">CISPR 25 Class 5 — PK (mais restritivo)</option>
              <option value="iec_generic">IEC 61000-6-3 (residencial)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted">Máx pontos (decimação)</label>
            <input className="input" type="number" min="200" max="20000" value={params.max_points}
              onChange={(e) => setParam('max_points', +e.target.value)} />
          </div>
        </div>

        {/* Visual options */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel md:col-span-2">
          <div className="text-sm font-semibold">Opções visuais</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Toggle label="Escala log (eixo X)"   hint="Padrão EMC"                    checked={params.xlog          ?? false} onChange={() => tog('xlog', false)} />
            <Toggle label="Marcador de limite"     hint="Sobrepõe curva no gráfico"     checked={params.showLimit     ?? true}  onChange={() => tog('showLimit')} />
            <Toggle label="Colorir excedências"    hint="Vermelho acima do limite"       checked={params.colorExceed   ?? true}  onChange={() => tog('colorExceed')} />
            <Toggle label="Gráfico de margem"      hint="Tab extra nos resultados"       checked={params.showMargin    ?? true}  onChange={() => tog('showMargin')} />
            <Toggle label="Waterfall (cascata)"    hint="Heatmap de múltiplos arquivos"  checked={params.showWaterfall ?? true}  onChange={() => tog('showWaterfall')} />
            <Toggle label="Histograma"             hint="Distribuição de amplitudes"     checked={params.showHistogram ?? true}  onChange={() => tog('showHistogram')} />
            <Toggle label="Harmônicos"             hint="Linhas dos harmônicos"          checked={params.showHarmonics ?? true}  onChange={() => tog('showHarmonics')} />
            <Toggle label="Noise floor"            hint="Estimativa do piso de ruído"    checked={params.showNoiseFloor?? true}  onChange={() => tog('showNoiseFloor')} />
            <Toggle label="Stats por banda"        hint="Tabela min/max/mean por faixa"  checked={params.showBandStats ?? true}  onChange={() => tog('showBandStats')} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex items-center justify-between">
        <button onClick={() => setStep('upload')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#1f2a36] text-muted hover:text-white hover:border-white/20 transition-all text-sm">
          <ArrowLeft size={14} /> Voltar
        </button>
        <button onClick={process} disabled={loading || !files.length}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-[#081018] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #57d6ff, #00d4a4)', boxShadow: '0 12px 30px rgba(87,214,255,0.25)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? 'Processando...' : 'Processar'}
        </button>
      </div>
    </div>
  )
}
