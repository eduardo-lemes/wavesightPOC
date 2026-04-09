import React, { useEffect, useState } from 'react'
import { useStore, authFetch } from '../store'
import { motion } from 'framer-motion'
import { Upload, FolderOpen, FileText, Settings } from 'lucide-react'

const CARDS = [
  { id: 'tool',     label: 'Upload & Análise', desc: 'Envie CSVs e visualize picos, bandas e padrões em 2D/3D.', Icon: Upload,    color: 'rgba(87,214,255,0.08)'  },
  { id: 'projects', label: 'Projetos',          desc: 'Organize suas análises em campanhas e projetos.',          Icon: FolderOpen, color: 'rgba(140,123,255,0.08)' },
  { id: 'reports',  label: 'Relatórios',        desc: 'Consulte, reprocesse ou exclua relatórios gerados.',       Icon: FileText,   color: 'rgba(0,212,164,0.08)'   },
  { id: 'settings', label: 'Configurações',     desc: 'Preferências, IA e informações do sistema.',               Icon: Settings,   color: 'rgba(150,163,173,0.06)' },
]

export default function Dashboard({ setView }) {
  const { user } = useStore()
  const [stats, setStats] = useState({ projects: '—', analyses: '—' })

  useEffect(() => {
    Promise.all([
      authFetch('/projects').then((r) => r.ok ? r.json() : []),
      authFetch('/analyses?limit=1').then((r) => r.ok ? r.json() : []),
    ]).then(([projects, analyses]) => {
      setStats({
        projects: Array.isArray(projects) ? projects.length : '—',
        analyses: Array.isArray(analyses) ? analyses.length : '—',
      })
    }).catch(() => {})
  }, [])

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold">Olá, {user?.name?.split(' ')[0] || '—'} 👋</h2>
        <p className="text-muted mt-1">Bem-vindo ao WaveSight. Escolha uma opção para começar.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[['Projetos', stats.projects, 'text-[#8b7bff]'], ['Análises salvas', stats.analyses, 'text-accent']].map(([label, val, color]) => (
          <div key={label} className="flex flex-col gap-1 p-4 rounded-2xl border border-[#1f2a36] bg-panel">
            <div className="text-xs text-muted">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CARDS.map(({ id, label, desc, Icon, color }, i) => (
          <motion.button key={id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => setView(id)}
            className="flex flex-col gap-3 p-5 rounded-2xl border border-[#1f2a36] text-left transition-all hover:border-white/15"
            style={{ background: color }}>
            <Icon size={22} className="text-accent" />
            <div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs text-muted mt-1 leading-relaxed">{desc}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
