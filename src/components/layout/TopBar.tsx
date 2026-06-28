import { PanelLeft, Plus, Download, Telescope, Orbit } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CommandBar } from './CommandBar'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { exportGraphAsJson } from '@/lib/exportJson'

export function TopBar() {
  const leftOpen = useGalaxyStore((s) => s.leftSidebarOpen)
  const setLeftOpen = useGalaxyStore((s) => s.setLeftSidebarOpen)
  const setAddOpen = useGalaxyStore((s) => s.setAddMemoryOpen)
  const discoveriesOpen = useGalaxyStore((s) => s.discoveriesOpen)
  const setDiscoveriesOpen = useGalaxyStore((s) => s.setDiscoveriesOpen)
  const graph = useGalaxyStore((s) => s.graph)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 px-4 py-3">
      {/* Brand */}
      <div className="pointer-events-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLeftOpen(!leftOpen)}
          title="Toggle navigator"
          className="shrink-0"
        >
          <PanelLeft size={18} />
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Orbit size={22} className="text-gold" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-gradient">
              Memory Galaxy
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-silver/70">
              v1 · {graph.nodes.length} nodes
            </div>
          </div>
        </div>
      </div>

      {/* Command bar (center) */}
      <div className="pointer-events-auto flex flex-1 justify-center">
        <CommandBar />
      </div>

      {/* Actions */}
      <div className="pointer-events-auto flex items-center gap-2">
        <Button
          variant={discoveriesOpen ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setDiscoveriesOpen(!discoveriesOpen)}
          title="Discoveries"
        >
          <Telescope size={16} />
          <span className="hidden sm:inline">Discoveries</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => exportGraphAsJson(graph)}
          title="Export graph as JSON"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button variant="gold" size="sm" onClick={() => setAddOpen(true)} title="Add memory">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Memory</span>
        </Button>
      </div>
    </header>
  )
}
