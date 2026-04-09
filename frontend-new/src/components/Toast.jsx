import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastCtx = createContext(null)

let _id = 0
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'info') => {
    const id = ++_id
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const remove = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <ToastCtx.Provider value={add}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(({ id, msg, type }) => {
            const Icon = type === 'ok' ? CheckCircle : type === 'error' ? XCircle : Info
            const color = type === 'ok' ? 'text-[#00d4a4]' : type === 'error' ? 'text-red-400' : 'text-accent'
            return (
              <motion.div key={id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1f2a36] bg-[#151b23] shadow-xl text-sm max-w-xs">
                <Icon size={15} className={`flex-none ${color}`} />
                <span className="flex-1 text-white/90">{msg}</span>
                <button onClick={() => remove(id)} className="text-muted hover:text-white flex-none">
                  <X size={13} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
