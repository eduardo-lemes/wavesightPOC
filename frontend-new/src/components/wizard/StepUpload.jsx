import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useStore } from '../../store'
import { motion } from 'framer-motion'
import { UploadCloud, X, FileText, ArrowRight } from 'lucide-react'

export default function StepUpload() {
  const { files, setFiles, setStep } = useStore()

  const onDrop = useCallback((accepted) => {
    const current = useStore.getState().files
    setFiles([...current, ...accepted])
  }, [setFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/octet-stream': ['.dfl'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/bmp': ['.bmp'],
    },
    multiple: true,
  })

  const remove = (i) => setFiles(files.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col gap-6">
      {/* Drop zone */}
      <div {...getRootProps()}
        className={`relative flex flex-col items-center justify-center gap-4 p-16 rounded-2xl border-2 border-dashed cursor-pointer transition-all
          ${isDragActive ? 'border-accent bg-accent/5 scale-[1.01]' : 'border-[#1f2a36] hover:border-accent/40 hover:bg-white/[0.02]'}`}>
        <input {...getInputProps()} />
        <motion.div animate={{ y: isDragActive ? -6 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
          <UploadCloud size={52} className={`transition-colors ${isDragActive ? 'text-accent' : 'text-muted'}`} />
        </motion.div>
        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste CSVs ou DFLs aqui'}
          </div>
          <p className="text-sm text-muted mt-1">ou clique para selecionar — .csv / .dfl (R&S)</p>
        </div>
        <div className="flex gap-2 mt-2">
          {['CSV', 'DFL R&S', 'PNG/JPG (screenshot)'].map((t) => (
            <span key={t} className="text-xs px-3 py-1 rounded-full border border-[#1f2a36] bg-chip text-muted">{t}</span>
          ))}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2">
          <div className="text-xs text-muted uppercase tracking-widest mb-1">
            {files.length} arquivo{files.length > 1 ? 's' : ''} selecionado{files.length > 1 ? 's' : ''}
          </div>
          {files.map((f, i) => {
            const isImg = /\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f.name)
            return (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1f2a36] bg-panel">
                <FileText size={16} className={isImg ? 'text-[#8b7bff]' : 'text-accent'} />
                <span className="text-sm flex-1 truncate">{f.name}</span>
                {isImg && <span className="text-xs px-2 py-0.5 rounded-full bg-[#8b7bff]/10 text-[#8b7bff]">screenshot</span>}
                <span className="text-xs text-muted">{(f.size / 1024).toFixed(1)} KB</span>
                <button onClick={() => remove(i)} className="text-muted hover:text-red-400 transition-colors p-1">
                  <X size={14} />
                </button>
              </div>
            )
          })}
          {files.some(f => /\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f.name)) &&
           files.some(f => !(/\.(png|jpg|jpeg|bmp|tiff?)$/i.test(f.name))) && (
            <div className="flex items-start gap-3 text-xs bg-[#8b7bff]/08 border border-[#8b7bff]/20 rounded-xl px-4 py-3"
              style={{ background: 'rgba(140,123,255,0.06)' }}>
              <span className="text-[#8b7bff] text-base flex-none">📷</span>
              <div>
                <div className="text-white font-medium mb-0.5">Screenshot será adicionada como série extra</div>
                <div className="text-muted leading-relaxed">
                  Os dados CSV/DFL serão processados normalmente. O trace extraído da imagem aparecerá no gráfico com badge <span className="text-[#8b7bff]">📷 screenshot</span> e precisão aproximada (±2–5 dB). Útil para comparação visual.
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* CTA */}
      <div className="flex justify-end mt-2">
        <button
          disabled={!files.length}
          onClick={() => setStep('params')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#081018] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #57d6ff, #00d4a4)', boxShadow: files.length ? '0 12px 30px rgba(87,214,255,0.25)' : 'none' }}>
          Configurar parâmetros
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
