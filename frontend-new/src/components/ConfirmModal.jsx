import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { GRADIENT_BTN } from '../lib/constants'

export default function ConfirmModal({ open, title, desc, onConfirm, onCancel, danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm rounded-2xl border border-[#1f2a36] bg-[#151b23] p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-[#ffaf4b]'} />
              <div className="text-sm font-semibold text-white">{title}</div>
            </div>
            {desc && <p className="text-xs text-muted leading-relaxed">{desc}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-[#1f2a36] text-muted hover:text-white text-sm transition-all">
                Cancelar
              </button>
              <button onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={danger
                  ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
                  : { background: GRADIENT_BTN, color: '#081018' }}>
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
