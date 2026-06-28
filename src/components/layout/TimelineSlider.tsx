import { useMemo } from 'react'
import { Clock, RotateCcw } from 'lucide-react'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { Slider } from '@/components/ui/Slider'
import { timeBounds } from '@/lib/graphUtils'

/**
 * Bottom timeline. Dragging fades nodes whose `updatedAt` is newer than the
 * slider's implied cutoff, simulating temporal filtering of the galaxy.
 */
export function TimelineSlider() {
  const graph = useGalaxyStore((s) => s.graph)
  const timeline = useGalaxyStore((s) => s.timeline)
  const setTimeline = useGalaxyStore((s) => s.setTimeline)
  const timelineActive = useGalaxyStore((s) => s.timelineActive)

  const { min, max } = useMemo(() => timeBounds(graph.nodes), [graph])
  const cutoffMs = min + timeline * (max - min)
  const label = new Date(cutoffMs).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-20 flex justify-center px-4">
      <div className="flex w-full max-w-3xl items-center gap-3 rounded-2xl px-4 py-2.5 glass">
        <Clock size={15} className={timelineActive ? 'text-teal' : 'text-silver/70'} />
        <span className="hidden text-[10px] font-medium uppercase tracking-widest text-silver/70 sm:inline">
          Timeline
        </span>
        <span className="font-mono text-xs text-silver">{new Date(min).getFullYear()}</span>
        <Slider value={timeline} onValueChange={setTimeline} className="flex-1" />
        <span className="font-mono text-xs text-silver">{new Date(max).getFullYear()}</span>
        <div
          className={`min-w-[92px] rounded-lg border px-2 py-1 text-center font-mono text-xs ${
            timelineActive ? 'border-teal/40 text-teal' : 'border-galaxy-border text-silver'
          }`}
        >
          {label}
        </div>
        {timelineActive && (
          <button
            onClick={() => setTimeline(1)}
            title="Reset timeline"
            className="text-silver hover:text-teal"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
