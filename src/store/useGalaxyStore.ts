import { create } from 'zustand'
import type { MemoryEdge, MemoryGraph, MemoryNode, NodeType } from '@/types/memory'
import {
  mockAgents,
  mockDiscoveries,
  mockMemoryGraph,
} from '@/data/mockMemoryGraph'
import type { AgentEntity, Discovery } from '@/types/memory'

/**
 * A request to fly the camera to a node. We bump `nonce` on each request so the
 * CameraRig effect re-fires even when the same node is targeted twice.
 */
export interface FocusRequest {
  nodeId: string | null
  nonce: number
}

interface GalaxyState {
  // --- Data ---
  graph: MemoryGraph
  agents: AgentEntity[]
  discoveries: Discovery[]

  // --- Selection / hover ---
  selectedId: string | null
  hoveredId: string | null

  // --- Camera focus ---
  focus: FocusRequest

  // --- Sidebar / filters ---
  searchQuery: string
  typeFilters: Set<NodeType>
  galaxyFilter: string | null // galaxy node id, or null for all
  bookmarks: Set<string>
  recentIds: string[] // most-recently visited node ids (max 8)

  // --- Timeline ---
  /** 0..1 position of the timeline slider. 1 = present (show everything). */
  timeline: number
  timelineActive: boolean

  // --- UI panels ---
  leftSidebarOpen: boolean
  inspectorOpen: boolean
  addMemoryOpen: boolean
  discoveriesOpen: boolean

  // --- Actions ---
  selectNode: (id: string | null) => void
  hoverNode: (id: string | null) => void
  focusNode: (id: string) => void
  toggleBookmark: (id: string) => void
  setSearchQuery: (q: string) => void
  toggleTypeFilter: (t: NodeType) => void
  setGalaxyFilter: (id: string | null) => void
  resetFilters: () => void
  setTimeline: (v: number) => void
  setTimelineActive: (active: boolean) => void
  setLeftSidebarOpen: (open: boolean) => void
  setInspectorOpen: (open: boolean) => void
  setAddMemoryOpen: (open: boolean) => void
  setDiscoveriesOpen: (open: boolean) => void
  addNode: (node: MemoryNode, newEdges?: MemoryEdge[]) => void
  resetView: () => void
}

const ALL_TYPES: NodeType[] = [
  'galaxy',
  'system',
  'planet',
  'document',
  'concept',
  'fact',
  'agent',
]

function pushRecent(recent: string[], id: string): string[] {
  const next = [id, ...recent.filter((r) => r !== id)]
  return next.slice(0, 8)
}

export const useGalaxyStore = create<GalaxyState>((set) => ({
  graph: mockMemoryGraph,
  agents: mockAgents,
  discoveries: mockDiscoveries,

  selectedId: null,
  hoveredId: null,
  focus: { nodeId: null, nonce: 0 },

  searchQuery: '',
  typeFilters: new Set(ALL_TYPES),
  galaxyFilter: null,
  bookmarks: new Set<string>(),
  recentIds: [],

  timeline: 1,
  timelineActive: false,

  leftSidebarOpen: true,
  inspectorOpen: false,
  addMemoryOpen: false,
  discoveriesOpen: false,

  selectNode: (id) =>
    set((s) => ({
      selectedId: id,
      inspectorOpen: id !== null,
      recentIds: id ? pushRecent(s.recentIds, id) : s.recentIds,
    })),

  hoverNode: (id) => set({ hoveredId: id }),

  focusNode: (id) =>
    set((s) => ({
      focus: { nodeId: id, nonce: s.focus.nonce + 1 },
      selectedId: id,
      inspectorOpen: true,
      recentIds: pushRecent(s.recentIds, id),
    })),

  toggleBookmark: (id) =>
    set((s) => {
      const next = new Set(s.bookmarks)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { bookmarks: next }
    }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleTypeFilter: (t) =>
    set((s) => {
      const next = new Set(s.typeFilters)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return { typeFilters: next }
    }),

  setGalaxyFilter: (id) => set({ galaxyFilter: id }),

  resetFilters: () =>
    set({
      searchQuery: '',
      typeFilters: new Set(ALL_TYPES),
      galaxyFilter: null,
    }),

  setTimeline: (v) => set({ timeline: v, timelineActive: v < 0.999 }),
  setTimelineActive: (active) => set({ timelineActive: active }),

  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setAddMemoryOpen: (open) => set({ addMemoryOpen: open }),
  setDiscoveriesOpen: (open) => set({ discoveriesOpen: open }),

  addNode: (node, newEdges = []) =>
    set((s) => ({
      graph: {
        nodes: [...s.graph.nodes, node],
        edges: [...s.graph.edges, ...newEdges],
      },
      selectedId: node.id,
      inspectorOpen: true,
      focus: { nodeId: node.id, nonce: s.focus.nonce + 1 },
    })),

  resetView: () =>
    set((s) => ({
      selectedId: null,
      hoveredId: null,
      inspectorOpen: false,
      galaxyFilter: null,
      timeline: 1,
      timelineActive: false,
      focus: { nodeId: null, nonce: s.focus.nonce + 1 },
    })),
}))
