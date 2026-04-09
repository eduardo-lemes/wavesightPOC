import React from 'react'
import { useStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'
import StepUpload from '../components/wizard/StepUpload'
import StepParams from '../components/wizard/StepParams'
import StepResults from '../components/wizard/StepResults'
import { Upload, SlidersHorizontal, BarChart2 } from 'lucide-react'

const STEPS = [
  { id: 'upload',  label: 'Arquivos',   Icon: Upload },
  { id: 'params',  label: 'Parâmetros', Icon: SlidersHorizontal },
  { id: 'results', label: 'Resultados', Icon: BarChart2 },
]

export default function UploadWizard() {
  const { step, setStep, files, results } = useStore()
  const currentIdx = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-10">
        {STEPS.map(({ id, label, Icon }, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <React.Fragment key={id}>
              <button
                onClick={() => {
                  if (i === 0) setStep('upload')
                  if (i === 1 && files.length) setStep('params')
                  if (i === 2 && results) setStep('results')
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-accent/10 text-accent border border-accent/25' : done ? 'text-white/70 hover:text-white' : 'text-muted cursor-default'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-none
                  ${active ? 'bg-accent text-[#081018]' : done ? 'bg-white/10 text-white' : 'bg-[#1f2a36] text-muted'}`}>
                  {done ? '✓' : <Icon size={13} />}
                </div>
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < currentIdx ? 'bg-accent/30' : 'bg-[#1f2a36]'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}>
          {step === 'upload'  && <StepUpload />}
          {step === 'params'  && <StepParams />}
          {step === 'results' && <StepResults />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
