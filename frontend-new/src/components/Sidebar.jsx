import React, { useState } from 'react'
import { LayoutDashboard, Upload, FileText, BarChart2, FolderOpen, Settings, ChevronLeft } from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Início',         Icon: LayoutDashboard },
  { id: 'tool',      label: 'Upload & Análise',Icon: Upload },
  { id: 'reports',   label: 'Relatórios',      Icon: FileText },
  { id: 'projects',  label: 'Projetos',        Icon: FolderOpen },
  { id: 'settings',  label: 'Configurações',   Icon: Settings },
]

export default function Sidebar({ view, setView }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`sticky top-0 h-screen flex flex-col border-r border-[#1f2a36] transition-all duration-300 ${collapsed ? 'w-14' : 'w-64'}`}
      style={{ background: 'radial-gradient(700px 380px at 20% 10%, rgba(87,214,255,0.07) 0%, transparent 60%), linear-gradient(180deg, rgba(13,18,26,0.8) 0%, rgba(9,12,18,0.6) 100%)', backdropFilter: 'blur(10px)' }}>

      {/* Brand */}
      <div className={`m-3 rounded-2xl border border-[#1f2a36] overflow-hidden ${collapsed ? 'p-2' : 'p-3'}`}
        style={{ background: 'rgba(10,14,20,0.4)' }}>
        <img src="/assets/logo.png" alt="WaveSight" className="w-full rounded-xl" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-2 flex-1">
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setView(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full
              ${view === id
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-white/80 hover:bg-white/5 border border-transparent'}`}>
            <Icon size={16} className="flex-none" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="m-3 py-2 rounded-xl border border-[#1f2a36] text-muted hover:text-accent hover:bg-accent/5 transition-all flex items-center justify-center">
        <ChevronLeft size={14} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  )
}
