import { AnimatePresence, motion } from 'framer-motion'
import { Telescope, X, ChevronRight } from 'lucide-react'
import { useGalaxyStore } from '@/store/useGalaxyStore'

/**
 * Constellation Discovery panel — mock AI-generated insights about the graph.
 * Clicking a discovery flies the camera to its first referenced node.
 */
export function DiscoveriesPanel() {
  const open = useGalaxyStore((s) => s.discoveriesOpen)
  const setOpen = useGalaxyStore((s) => s.setDiscoveriesOpen)
  const discoveries = useGalaxyStore((s) => s.discoveries)
  const focusNode = useGalaxyStore((s) => s.focusNode)

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="absolute right-3 top-[68px] z-30 flex max-h-[60vh] w-[340px] flex-col rounded-2xl glass-strong overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-galaxy-border/60 p-4">
            <div className="flex items-center gap-2">
              <Telescope size={16} className="text-teal" />
              <h2 className="text-sm font-semibold text-ink">Discoveries</h2>
              <span className="rounded-md bg-teal/10 px-1.5 py-0.5 text-[10px] font-medium text-teal">
                {discoveries.length}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-silver hover:text-ink">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="px-1 pb-1 text-[11px] text-silver/70">
              AI-surfaced connections across your galaxy.
            </p>
            {discoveries.map((d) => (
              <button
                key={d.id}
                onClick={() => d.nodeIds[0] && focusNode(d.nodeIds[0])}
                className="group w-full rounded-xl border border-galaxy-border bg-background/30 p-3 text-left transition-all hover:border-teal/40 hover:bg-teal/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-ink">{d.title}</h3>
                  <ChevronRight
                    size={15}
                    className="mt-0.5 shrink-0 text-silver/50 group-hover:text-teal"
                  />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-silver">{d.detail}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-galaxy-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-teal"
                      style={{ width: `${Math.round(d.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-silver/70">
                    {Math.round(d.confidence * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
