import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'glass-strong relative z-10 w-full max-w-lg rounded-2xl',
              className,
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="flex items-start justify-between p-5 border-b border-galaxy-border/60">
              <div>
                {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
                {description && (
                  <p className="mt-1 text-sm text-silver">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-silver hover:text-ink hover:bg-galaxy-border/50 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
