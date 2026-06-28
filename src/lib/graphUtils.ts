import type { MemoryGraph, MemoryNode, Vec3 } from '@/types/memory'

/** Build an id→node lookup map. */
export function indexNodes(nodes: MemoryNode[]): Map<string, MemoryNode> {
  return new Map(nodes.map((n) => [n.id, n]))
}

/** Tuple form used by three.js (`position={...}`). */
export function toTuple(v: Vec3): [number, number, number] {
  return [v.x, v.y, v.z]
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/** Linear interpolation between two points (used for agent paths). */
export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

/**
 * Catmull-Rom-ish eased position along a polyline of points, looping.
 * `t` is 0..1 across the whole path. Returns the interpolated point.
 */
export function pointAlongPath(points: Vec3[], t: number): Vec3 {
  if (points.length === 0) return { x: 0, y: 0, z: 0 }
  if (points.length === 1) return points[0]
  const segments = points.length
  const scaled = (t % 1) * segments
  const i = Math.floor(scaled)
  const localT = scaled - i
  const a = points[i % points.length]
  const b = points[(i + 1) % points.length]
  // Smoothstep easing for organic motion.
  const eased = localT * localT * (3 - 2 * localT)
  return lerpVec3(a, b, eased)
}

/** All node ids directly connected to `id` via edges or relatedIds. */
export function neighborsOf(graph: MemoryGraph, id: string): Set<string> {
  const result = new Set<string>()
  for (const e of graph.edges) {
    if (e.source === id) result.add(e.target)
    if (e.target === id) result.add(e.source)
  }
  const node = graph.nodes.find((n) => n.id === id)
  node?.relatedIds.forEach((r) => result.add(r))
  return result
}

/** Min/max of created/updated timestamps across the graph (epoch ms). */
export function timeBounds(nodes: MemoryNode[]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const n of nodes) {
    const c = Date.parse(n.createdAt)
    const u = Date.parse(n.updatedAt)
    min = Math.min(min, c, u)
    max = Math.max(max, c, u)
  }
  if (!isFinite(min)) {
    const now = Date.now()
    return { min: now, max: now }
  }
  return { min, max }
}

/** Case-insensitive search over name, description, tags, category. */
export function matchesQuery(node: MemoryNode, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    node.name.toLowerCase().includes(q) ||
    node.description.toLowerCase().includes(q) ||
    node.category.toLowerCase().includes(q) ||
    node.tags.some((t) => t.toLowerCase().includes(q))
  )
}
