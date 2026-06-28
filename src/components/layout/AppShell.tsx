import { GalaxyCanvas } from '@/components/galaxy/GalaxyCanvas'
import { TopBar } from './TopBar'
import { LeftSidebar } from './LeftSidebar'
import { InspectorPanel } from './InspectorPanel'
import { TimelineSlider } from './TimelineSlider'
import { DiscoveriesPanel } from './DiscoveriesPanel'
import { AddMemoryModal } from './AddMemoryModal'

/**
 * Composes the full Memory Galaxy experience: the 3D canvas as the backdrop
 * with floating glassmorphism panels layered above it.
 */
export function AppShell() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* 3D galaxy (full-screen backdrop) */}
      <GalaxyCanvas />

      {/* Vignette for depth + readability of overlaid panels */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,10,24,0.65)_100%)]" />

      {/* UI layers */}
      <TopBar />
      <LeftSidebar />
      <InspectorPanel />
      <DiscoveriesPanel />
      <TimelineSlider />
      <AddMemoryModal />
    </div>
  )
}
