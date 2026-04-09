import React, { useEffect, useState } from 'react'
import { authFetch } from '../store'
import { Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

export default function Reports() {
  const toast = useToast()
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(null) // { id }

  const load = () => {
    setLoading(true)
    setError(null)
    authFetch('/analyses?limit=100')
      .then((r) => r.ok ? r.json() : Promise.reject('Erro ao carregar'))
      .then((d) => setReports(Array.isArray(d) ? d : []))
      .catch((e) => setError(typeof e === 'string' ? e : 'Falha ao carregar relatórios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async () => {
    const id = confirm?.id
    setConfirm(null)
    try {
      const res = await authFetch(`/analyses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast('Análise excluída', 'ok')
      load()
    } catch {
      toast('Falha ao excluir', 'error')
    }
  }

  const filtered = reports.filter((r) =>
    r.filename?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <ConfirmModal
        open={!!confirm}
        title="Excluir análise?"
        desc="Esta ação não pode ser desfeita."
        onConfirm={del}
        onCancel={() => setConfirm(null)}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">📋 Relatórios</h2>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1f2a36] text-muted hover:text-white text-xs transition-all">
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      <input className="input" placeholder="🔍 Buscar por nome..." value={search}
        onChange={(e) => setSearch(e.target.value)} />

      {loading && <div className="text-center py-12 text-muted">Carregando...</div>}
      {error && <div className="text-center py-12 text-red-400 text-sm">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-muted">Nenhum relatório encontrado.</div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="rounded-2xl border border-[#1f2a36] bg-panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2a36]">
                {['Arquivo', 'Tipo de emissão', 'Data', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-[#1f2a36]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white/90 truncate max-w-xs">{r.filename}</td>
                  <td className="px-4 py-3">
                    {r.emission_type ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                        ${r.emission_type === 'narrowband' ? 'bg-accent/10 text-accent' :
                          r.emission_type === 'broadband'  ? 'bg-[#ffaf4b]/10 text-[#ffaf4b]' :
                          'bg-[#8b7bff]/10 text-[#8b7bff]'}`}>
                        {r.emission_type}
                      </span>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setConfirm({ id: r.id })} className="text-muted hover:text-red-400 transition-colors p-1">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
