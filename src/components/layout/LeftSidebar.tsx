import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Bookmark, Clock, List, Star, X } from 'lucide-react'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { NODE_TYPES, TYPE_COLOR, TYPE_LABEL } from '@/lib/constants'
import { matchesQuery } from '@/lib/graphUtils'
import { cn } from '@/lib/cn'
import type { MemoryNode, NodeType } from '@/types/memory'

type ListTab = 'all' | 'bookmarks' | 'recent'

export function LeftSidebar() {
  const open = useGalaxyStore((s) => s.leftSidebarOpen)
  const setOpen = useGalaxyStore((s) => s.setLeftSidebarOpen)
  const graph = useGalaxyStore((s) => s.graph)
  const searchQuery = useGalaxyStore((s) => s.searchQuery)
  const setSearchQuery = useGalaxyStore((s) => s.setSearchQuery)
  const typeFilters = useGalaxyStore((s) => s.typeFilters)
  const toggleTypeFilter = useGalaxyStore((s) => s.toggleTypeFilter)
  const galaxyFilter = useGalaxyStore((s) => s.galaxyFilter)
  const setGalaxyFilter = useGalaxyStore((s) => s.setGalaxyFilter)
  const bookmarks = useGalaxyStore((s) => s.bookmarks)
  const recentIds = useGalaxyStore((s) => s.recentIds)
  const selectedId = useGalaxyStore((s) => s.selectedId)
  const focusNode = useGalaxyStore((s) => s.focusNode)

  const [tab, setTab] = useState<ListTab>('all')

  const galaxies = useMemo(() => graph.nodes.filter((n) => n.type === 'galaxy'), [graph])

  const list = useMemo(() => {
    let base: MemoryNode[]
    if (tab === 'bookmarks') base = graph.nodes.filter((n) => bookmarks.has(n.id))
    else if (tab === 'recent')
      base = recentIds.map((id) => graph.nodes.find((n) => n.id === id)).filter(Boolean) as MemoryNode[]
    else base = graph.nodes

    const filtered = base.filter(
      (n) => typeFilters.has(n.type) && matchesQuery(n, searchQuery),
    )
    if (tab === 'recent') return filtered // keep recency order
    return filtered.sort((a, b) => b.importance - a.importance)
  }, [tab, graph, bookmarks, recentIds, typeFilters, searchQuery])

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: -340, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -340, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="absolute left-3 top-[68px] bottom-[88px] z-20 flex w-[300px] flex-col rounded-2xl glass overflow-hidden"
        >
          {/* Search */}
          <div className="p-3 border-b border-galaxy-border/60">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-silver/70" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories…"
                className="pl-9"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 border-b border-galaxy-border/60 space-y-3">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-silver/70">
                Filter by galaxy
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={galaxyFilter === null} onClick={() => setGalaxyFilter(null)}>
                  All
                </FilterChip>
                {galaxies.map((g) => (
                  <FilterChip
                    key={g.id}
                    active={galaxyFilter === g.id}
                    color={g.color}
                    onClick={() => setGalaxyFilter(galaxyFilter === g.id ? null : g.id)}
                  >
                    {g.name.replace(' Galaxy', '')}
                  </FilterChip>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-silver/70">
                Filter by type
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NODE_TYPES.map((t) => (
                  <TypeChip key={t} type={t} active={typeFilters.has(t)} onClick={() => toggleTypeFilter(t)} />
                ))}
              </div>
            </div>
          </div>

          {/* List tabs */}
          <div className="px-3 pt-3">
            <Tabs<ListTab>
              tabs={[
                { id: 'all', label: 'All' },
                { id: 'bookmarks', label: 'Saved' },
                { id: 'recent', label: 'Recent' },
              ]}
              value={tab}
              onChange={setTab}
              className="w-full justify-between"
            />
          </div>

          {/* Node list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {list.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-silver/60">
                {tab === 'bookmarks' ? <Bookmark size={20} /> : tab === 'recent' ? <Clock size={20} /> : <List size={20} />}
                <span className="text-xs">
                  {tab === 'bookmarks'
                    ? 'No bookmarks yet'
                    : tab === 'recent'
                      ? 'No recent nodes'
                      : 'No nodes match'}
                </span>
              </div>
            )}
            {list.map((n) => (
              <button
                key={n.id}
                onClick={() => focusNode(n.id)}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors',
                  selectedId === n.id ? 'bg-teal/10 border border-teal/30' : 'border border-transparent hover:bg-galaxy-border/40',
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: n.color, boxShadow: `0 0 8px ${n.color}99` }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{n.name}</span>
                  <span className="block truncate text-[11px] text-silver/70">
                    {TYPE_LABEL[n.type]} · {n.category}
                  </span>
                </span>
                {bookmarks.has(n.id) && <Star size={12} className="text-gold shrink-0" fill="#D4A843" />}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-galaxy-border/60 px-3 py-2 text-[11px] text-silver/70">
            <span>{list.length} shown</span>
            <button onClick={() => setOpen(false)} className="flex items-center gap-1 hover:text-ink">
              <X size={12} /> hide
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border px-2 py-1 text-[11px] font-medium transition-all',
        active
          ? 'border-teal/50 bg-teal/10 text-teal'
          : 'border-galaxy-border bg-background/30 text-silver hover:text-ink',
      )}
      style={active && color ? { borderColor: `${color}88`, color, backgroundColor: `${color}1a` } : undefined}
    >
      {children}
    </button>
  )
}

function TypeChip({ type, active, onClick }: { type: NodeType; active: boolean; onClick: () => void }) {
  const color = TYPE_COLOR[type]
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-all',
        active ? 'text-ink' : 'border-galaxy-border bg-background/30 text-silver/50 line-through',
      )}
      style={active ? { borderColor: `${color}88`, backgroundColor: `${color}14` } : undefined}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: active ? color : '#3A4A6B' }} />
      {TYPE_LABEL[type]}
    </button>
  )
}
