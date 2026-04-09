import React, { useEffect, useState } from 'react'
import { authFetch } from '../store'
import { Plus, Trash2, FolderOpen } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

export default function Projects() {
  const toast = useToast()
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    authFetch('/projects')
      .then((r) => r.ok ? r.json() : Promise.reject('Erro ao carregar'))
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch((e) => setError(typeof e === 'string' ? e : 'Falha ao carregar projetos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const res = await authFetch('/projects', { method: 'POST', body: JSON.stringify({ name, description: desc }) })
      if (!res.ok) throw new Error()
      setName(''); setDesc('')
      toast('Projeto criado', 'ok')
      load()
    } catch {
      toast('Falha ao criar projeto', 'error')
    }
  }

  const del = async () => {
    const id = confirm?.id
    setConfirm(null)
    try {
      const res = await authFetch(`/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast('Projeto excluído', 'ok')
      load()
    } catch {
      toast('Falha ao excluir', 'error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <ConfirmModal
        open={!!confirm}
        title="Excluir projeto?"
        desc="Todas as análises vinculadas serão removidas. Esta ação não pode ser desfeita."
        onConfirm={del}
        onCancel={() => setConfirm(null)}
      />

      <h2 className="text-xl font-bold">📁 Projetos</h2>

      <form onSubmit={create} className="flex gap-3 p-5 rounded-2xl border border-[#1f2a36] bg-panel">
        <input className="input flex-1" placeholder="Nome do projeto" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="input flex-1" placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-[#081018] text-sm flex-none"
          style={{ background: 'linear-gradient(135deg, #57d6ff, #00d4a4)' }}>
          <Plus size={14} /> Criar
        </button>
      </form>

      {loading && <div className="text-center py-12 text-muted">Carregando...</div>}
      {error && <div className="text-center py-12 text-red-400 text-sm">{error}</div>}

      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-12 text-muted flex flex-col items-center gap-3">
          <FolderOpen size={40} className="opacity-30" />
          Nenhum projeto ainda.
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1f2a36] bg-panel hover:border-white/15 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold text-white">{p.name}</div>
                <button onClick={() => setConfirm({ id: p.id })} className="text-muted hover:text-red-400 transition-colors p-1 flex-none">
                  <Trash2 size={13} />
                </button>
              </div>
              {p.description && <div className="text-xs text-muted">{p.description}</div>}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{p.analysis_count || 0} análises</span>
                <span className="text-xs text-muted">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
