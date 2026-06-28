import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { mockMemoryGraph } from '@/data/mockMemoryGraph'
import { matchesQuery, timeBounds } from '@/lib/graphUtils'
import type { MemoryGraph, MemoryNode } from '@/types/memory'

/**
 * TanStack Query is wired up even though V1 data is local. This keeps the
 * fetch boundary in place so swapping `queryFn` for a Supabase call in V2 is a
 * one-line change. The store remains the live, mutable source of truth for the
 * session (add memory, etc.); the query just seeds/refreshes it.
 */
async function fetchMemoryGraph(): Promise<MemoryGraph> {
  // Simulate an async data source. Replace with a Supabase query in V2.
  return Promise.resolve(mockMemoryGraph)
}

export function useMemoryGraphQuery() {
  return useQuery({
    queryKey: ['memory-graph'],
    queryFn: fetchMemoryGraph,
    staleTime: Infinity,
  })
}

export interface NodeVisibility {
  node: MemoryNode
  /** Whether the node passes search/type/galaxy filters. */
  visible: boolean
  /** 0..1 opacity from the timeline (1 when timeline inactive). */
  timeOpacity: number
  /** Final dimming applied in 3D: visible & timeOpacity combined. */
  opacity: number
}

/**
 * Resolve which nodes are visible and how strongly, given the current search,
 * type filters, galaxy filter, and timeline position.
 */
export function useVisibleNodes(): {
  graph: MemoryGraph
  byId: Map<string, MemoryNode>
  visibility: Map<string, NodeVisibility>
} {
  const graph = useGalaxyStore((s) => s.graph)
  const searchQuery = useGalaxyStore((s) => s.searchQuery)
  const typeFilters = useGalaxyStore((s) => s.typeFilters)
  const galaxyFilter = useGalaxyStore((s) => s.galaxyFilter)
  const timeline = useGalaxyStore((s) => s.timeline)
  const timelineActive = useGalaxyStore((s) => s.timelineActive)

  return useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    const { min, max } = timeBounds(graph.nodes)
    const span = Math.max(1, max - min)
    // Cutoff timestamp implied by the slider.
    const cutoff = min + timeline * span
    // A soft window so nodes fade rather than pop.
    const window = span * 0.18

    // Resolve a node's galaxy by walking parentId chain.
    const galaxyOf = (n: MemoryNode): string | undefined => {
      let cur: MemoryNode | undefined = n
      const seen = new Set<string>()
      while (cur && !seen.has(cur.id)) {
        if (cur.type === 'galaxy') return cur.id
        seen.add(cur.id)
        cur = cur.parentId ? byId.get(cur.parentId) : undefined
      }
      return undefined
    }

    const visibility = new Map<string, NodeVisibility>()
    for (const node of graph.nodes) {
      const passesType = typeFilters.has(node.type)
      const passesSearch = matchesQuery(node, searchQuery)
      const passesGalaxy = !galaxyFilter || galaxyOf(node) === galaxyFilter
      const visible = passesType && passesSearch && passesGalaxy

      let timeOpacity = 1
      if (timelineActive) {
        const updated = Date.parse(node.updatedAt)
        // Fully visible if updated before cutoff; fade within the window beyond.
        const delta = updated - cutoff
        if (delta <= 0) timeOpacity = 1
        else if (delta >= window) timeOpacity = 0.05
        else timeOpacity = 1 - (delta / window) * 0.95
      }

      const opacity = visible ? timeOpacity : 0.06
      visibility.set(node.id, { node, visible, timeOpacity, opacity })
    }

    return { graph, byId, visibility }
  }, [graph, searchQuery, typeFilters, galaxyFilter, timeline, timelineActive])
}
