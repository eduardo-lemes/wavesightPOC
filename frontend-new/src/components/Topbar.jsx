import React from 'react'

export default function Topbar({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#1f2a36]"
      style={{ background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(10px)' }}>
      <div>
        <h1 className="text-lg font-bold tracking-tight">WaveSight</h1>
        <p className="text-xs text-muted">Upload e análise de medições EMC com visualização 2D/3D</p>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full border border-[#1f2a36] bg-chip text-white/80">
            {user.name || user.email}
          </span>
          <button onClick={onLogout}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#1f2a36] text-muted hover:text-white hover:border-white/20 transition-all">
            Sair
          </button>
        </div>
      )}
    </header>
  )
}
