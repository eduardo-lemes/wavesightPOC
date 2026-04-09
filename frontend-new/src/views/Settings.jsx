import React, { useEffect, useState } from 'react'
import { authFetch, useStore } from '../store'

export default function Settings() {
  const { user } = useStore()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    authFetch('/health').then((r) => r.json()).then(setHealth).catch(() => {})
  }, [])

  const rows = [
    ['Versão', 'WaveSight EMC v1.0.0'],
    ['Backend', 'FastAPI + Python 3.12'],
    ['Banco', 'PostgreSQL 16'],
    ['AI Provider', health?.ai_provider || 'Não configurado'],
    ['AI Model', health?.ai_model || '—'],
    ['Storage', health?.storage || 'Local'],
  ]

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <h2 className="text-xl font-bold">⚙️ Configurações</h2>

      {/* Profile */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
        <div className="text-sm font-semibold">👤 Perfil</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Nome</label>
            <input className="input" value={user?.name || ''} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">E-mail</label>
            <input className="input" value={user?.email || ''} disabled />
          </div>
        </div>
      </div>

      {/* System */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
        <div className="text-sm font-semibold">💻 Sistema</div>
        <div className="flex flex-col gap-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-[#1f2a36]/50 text-sm">
              <span className="text-muted">{k}</span>
              <span className="text-white/90">{v}</span>
            </div>
          ))}
        </div>
        <a href="/api/docs" target="_blank" className="text-xs text-accent hover:underline">Swagger UI ↗</a>
      </div>
    </div>
  )
}
