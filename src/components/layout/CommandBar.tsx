import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CornerDownLeft } from 'lucide-react'
import { useGalaxyCommands, COMMAND_SUGGESTIONS } from '@/hooks/useGalaxyCommands'
import { cn } from '@/lib/cn'

/**
 * Memory Command Bar — "Ask your galaxy anything…".
 * Runs lightweight mock commands that move the camera / filter the galaxy.
 */
export function CommandBar() {
  const { run } = useGalaxyCommands()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const submit = (text: string) => {
    const result = run(text)
    setFeedback(result.message)
    setValue('')
    window.clearTimeout((submit as any)._t)
    ;(submit as any)._t = window.setTimeout(() => setFeedback(null), 2600)
  }

  return (
    <div className="relative w-full max-w-xl">
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-3 h-11 glass transition-all',
          focused && 'neon-border',
        )}
      >
        <Sparkles size={16} className="text-teal shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) submit(value)
          }}
          placeholder="Ask your galaxy anything…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-silver/60 focus:outline-none"
        />
        {value.trim() && (
          <button
            onClick={() => submit(value)}
            className="flex items-center gap-1 text-[11px] text-silver hover:text-teal"
          >
            <CornerDownLeft size={13} /> run
          </button>
        )}
      </div>

      {/* Suggestions / feedback dropdown */}
      <AnimatePresence>
        {(focused || feedback) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-12 z-30 rounded-xl p-2 glass-strong"
          >
            {feedback && (
              <div className="mb-1 px-2 py-1 text-xs text-teal">{feedback}</div>
            )}
            {focused && (
              <div className="flex flex-wrap gap-1.5">
                {COMMAND_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    // onMouseDown so it fires before input blur clears focus.
                    onMouseDown={(e) => {
                      e.preventDefault()
                      submit(s)
                    }}
                    className="rounded-md border border-galaxy-border bg-background/40 px-2 py-1 text-[11px] text-silver hover:text-teal hover:border-teal/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
