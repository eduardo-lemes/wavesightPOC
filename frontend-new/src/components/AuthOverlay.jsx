import React, { useState } from 'react'
import { useStore, authFetch } from '../store'
import { motion } from 'framer-motion'

export default function AuthOverlay() {
  const { setToken, setUser } = useStore()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setStatus('')
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password }

      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Erro')
      setToken(data.access_token)
      setUser(data.user)
    } catch (e) {
      setStatus(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{
        background: 'radial-gradient(900px 520px at 15% 20%, rgba(87,214,255,0.18) 0%, transparent 60%), radial-gradient(820px 520px at 82% 26%, rgba(140,123,255,0.16) 0%, transparent 60%), linear-gradient(160deg, rgba(8,12,18,0.95) 0%, rgba(8,12,18,0.85) 100%)',
        backdropFilter: 'blur(12px)',
      }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[900px] grid md:grid-cols-[1.1fr_1fr] rounded-2xl overflow-hidden border border-[#1f2a36]"
        style={{ background: 'linear-gradient(160deg, rgba(20,28,38,0.95) 0%, rgba(16,22,30,0.92) 100%)', boxShadow: '0 24px 90px rgba(0,0,0,0.55)' }}>

        {/* Hero */}
        <div className="hidden md:flex flex-col gap-5 p-8 border-r border-[#1f2a36]"
          style={{ background: 'radial-gradient(700px 420px at 20% 18%, rgba(87,214,255,0.12) 0%, transparent 60%)' }}>
          <img src="/assets/wavesight-logo.svg" alt="WaveSight" className="w-40 rounded-xl" />
          <div>
            <div className="text-lg font-bold text-white">Transforme medições em insights.</div>
            <p className="text-sm text-muted mt-1">Envie medições EMC, compare curvas, aplique limites e exporte relatórios.</p>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {['Envie vários CSVs e compare curvas', 'Aplique limites e normas em poucos cliques', 'Gere relatórios e exporte imagens'].map((t) => (
              <div key={t} className="flex items-start gap-3 text-sm text-white/90">
                <span className="mt-1 w-2 h-2 rounded-full bg-accent flex-none shadow-[0_0_0_4px_rgba(87,214,255,0.12)]" />
                {t}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[['Visualização 2D/3D','Gráficos interativos com picos e bandas'],['Limites e normas','CISPR, IEC e curvas customizadas'],['Relatórios','HTML, PDF e imagem'],['CSV simples','Duas colunas: freq + dBµV']].map(([t,d]) => (
              <div key={t} className="rounded-xl border border-[#1f2a36] bg-[#0f151d]/60 p-3">
                <div className="text-xs font-semibold text-white">{t}</div>
                <div className="text-xs text-muted mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-5 p-8 justify-center">
          <div className="text-xl font-bold">{mode === 'login' ? 'Entrar' : 'Criar conta'}</div>
          <p className="text-sm text-muted -mt-3">Use seu e-mail e senha.</p>

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">Nome</label>
              <input className="input" placeholder="Seu nome" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">E-mail</label>
            <input className="input" type="email" placeholder="voce@empresa.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted">Senha</label>
            <input className="input" type="password" placeholder="Sua senha" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>

          {status && <p className="text-xs text-red-400">{status}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-[#081018] transition-all hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #57d6ff, #00d4a4)', boxShadow: '0 14px 34px rgba(87,214,255,0.2)' }}>
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <div className="flex gap-2 justify-center text-xs text-muted">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            <button type="button" className="text-accent underline underline-offset-2 font-bold"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
