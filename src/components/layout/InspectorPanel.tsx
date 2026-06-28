import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Bookmark, BookmarkCheck, Sparkles, ArrowUpRight, Loader2 } from 'lucide-react'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AI_ACTIONS, TYPE_LABEL, TYPE_METAPHOR, type AiActionId } from '@/lib/constants'
import { neighborsOf } from '@/lib/graphUtils'
import type { MemoryNode } from '@/types/memory'

export function InspectorPanel() {
  const open = useGalaxyStore((s) => s.inspectorOpen)
  const selectedId = useGalaxyStore((s) => s.selectedId)
  const graph = useGalaxyStore((s) => s.graph)
  const setOpen = useGalaxyStore((s) => s.setInspectorOpen)
  const focusNode = useGalaxyStore((s) => s.focusNode)
  const bookmarks = useGalaxyStore((s) => s.bookmarks)
  const toggleBookmark = useGalaxyStore((s) => s.toggleBookmark)

  const node = useMemo(
    () => graph.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId],
  )

  const related = useMemo(() => {
    if (!node) return []
    const ids = neighborsOf(graph, node.id)
    return graph.nodes.filter((n) => ids.has(n.id))
  }, [graph, node])

  const [action, setAction] = useState<AiActionId | null>(null)
  const [pending, setPending] = useState(false)
  const [response, setResponse] = useState<string | null>(null)

  const runAction = (id: AiActionId) => {
    if (!node) return
    setAction(id)
    setPending(true)
    setResponse(null)
    // Simulate an AI call. V2 wires this to a real model/agent.
    window.setTimeout(() => {
      setResponse(mockAiResponse(id, node, related))
      setPending(false)
    }, 650)
  }

  return (
    <AnimatePresence>
      {open && node && (
        <motion.aside
          key={node.id}
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="absolute right-3 top-[68px] bottom-[88px] z-20 flex w-[340px] flex-col rounded-2xl glass overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-4 border-b border-galaxy-border/60">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: `linear-gradient(90deg, ${node.color}, transparent)` }}
            />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: node.color, boxShadow: `0 0 8px ${node.color}` }}
                  />
                  <Badge tone="custom" color={node.color}>
                    {TYPE_LABEL[node.type]} · {TYPE_METAPHOR[node.type]}
                  </Badge>
                </div>
                <h2 className="mt-2 truncate text-lg font-semibold text-ink">{node.name}</h2>
                <p className="text-xs text-silver/80">{node.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleBookmark(node.id)}
                  title={bookmarks.has(node.id) ? 'Remove bookmark' : 'Bookmark'}
                >
                  {bookmarks.has(node.id) ? (
                    <BookmarkCheck size={16} className="text-gold" />
                  ) : (
                    <Bookmark size={16} />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} title="Close">
                  <X size={16} />
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Description */}
            <p className="text-sm leading-relaxed text-silver">{node.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Importance" value={`${node.importance}`} accent>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-galaxy-border">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${node.importance}%`,
                      background: 'linear-gradient(90deg,#D4A843,#00D9B5)',
                    }}
                  />
                </div>
              </Stat>
              <Stat label="Memories" value={node.memoryCount.toLocaleString()} />
              <Stat label="Created" value={formatDate(node.createdAt)} />
              <Stat label="Updated" value={formatDate(node.updatedAt)} />
            </div>

            {/* Tags */}
            {node.tags.length > 0 && (
              <div>
                <SectionLabel>Tags</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((t) => (
                    <Badge key={t} tone="silver">
                      #{t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related nodes */}
            {related.length > 0 && (
              <div>
                <SectionLabel>Related nodes · {related.length}</SectionLabel>
                <div className="space-y-1">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => focusNode(r.id)}
                      className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left hover:bg-galaxy-border/40 hover:border-galaxy-border"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
                      <span className="min-w-0 flex-1 truncate text-xs text-ink">{r.name}</span>
                      <span className="text-[10px] text-silver/60">{TYPE_LABEL[r.type]}</span>
                      <ArrowUpRight size={12} className="text-silver/50 group-hover:text-teal" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI actions */}
            <div>
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles size={12} className="text-teal" /> Suggested AI actions
                </span>
              </SectionLabel>
              <div className="grid grid-cols-1 gap-1.5">
                {AI_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => runAction(a.id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                      action === a.id
                        ? 'border-teal/50 bg-teal/10 text-teal'
                        : 'border-galaxy-border bg-background/30 text-silver hover:text-ink hover:border-teal/40'
                    }`}
                  >
                    {a.label}
                    {action === a.id && pending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={12} className="opacity-60" />
                    )}
                  </button>
                ))}
              </div>

              {/* Mock response */}
              <AnimatePresence>
                {action && (response || pending) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 text-xs leading-relaxed text-ink/90">
                      {pending ? (
                        <span className="flex items-center gap-2 text-silver">
                          <Loader2 size={13} className="animate-spin" /> Thinking…
                        </span>
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">{response}</pre>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-silver/70">
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  children,
}: {
  label: string
  value: string
  accent?: boolean
  children?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-galaxy-border/70 bg-background/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-silver/60">{label}</div>
      <div className={`text-sm font-semibold ${accent ? 'text-gold' : 'text-ink'}`}>{value}</div>
      {children}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Deterministic mock AI responses derived from the node + its neighbors. */
function mockAiResponse(id: AiActionId, node: MemoryNode, related: MemoryNode[]): string {
  const names = related.slice(0, 4).map((r) => r.name)
  const list = names.length ? names.join(', ') : 'no directly linked nodes yet'
  switch (id) {
    case 'summarize':
      return `“${node.name}” is a ${TYPE_LABEL[node.type].toLowerCase()} in the ${node.category} space holding ~${node.memoryCount.toLocaleString()} memories (importance ${node.importance}/100). It connects to ${related.length} nodes including ${list}. Core theme: ${node.tags.join(', ') || 'general knowledge'}.`
    case 'related':
      return `Strongest semantic neighbors of “${node.name}”:\n• ${names.join('\n• ') || 'None yet — try linking related ideas.'}\nConsider exploring these to expand the cluster.`
    case 'next-steps':
      return `Next steps for “${node.name}”:\n1. Deepen documentation of ${names[0] ?? 'its key concept'}.\n2. Capture 2–3 new facts to raise its importance above ${Math.min(100, node.importance + 5)}.\n3. Link it to an under-connected node to bridge clusters.`
    case 'brief':
      return `PROJECT BRIEF — ${node.name}\nType: ${TYPE_LABEL[node.type]}\nCategory: ${node.category}\nObjective: ${node.description}\nKey relationships: ${list}\nImportance: ${node.importance}/100 · Memories: ${node.memoryCount.toLocaleString()}`
    case 'export-md':
      return `# ${node.name}\n\n**Type:** ${TYPE_LABEL[node.type]}  \n**Category:** ${node.category}  \n**Importance:** ${node.importance}/100\n\n${node.description}\n\n**Tags:** ${node.tags.map((t) => `#${t}`).join(' ')}\n\n**Related:** ${list}`
  }
}
