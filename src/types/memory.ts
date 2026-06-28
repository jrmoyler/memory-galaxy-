/**
 * Core domain types for Memory Galaxy.
 *
 * The galaxy is a knowledge graph. Every visible object in 3D space is a
 * `MemoryNode`; semantic relationships between them are `MemoryEdge`s.
 */

export type NodeType =
  | 'galaxy' // domains
  | 'system' // projects (solar systems)
  | 'planet' // knowledge bases
  | 'document' // documents (cities)
  | 'concept' // concepts (buildings)
  | 'fact' // facts (citizens)
  | 'agent' // animated AI entities

export type RelationType =
  | 'depends-on'
  | 'related-to'
  | 'derives-from'
  | 'references'
  | 'powers'

/** A 3D position in galaxy space. */
export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface MemoryNode {
  id: string
  name: string
  type: NodeType
  description: string
  category: string
  /** Parent node id (e.g. a planet's system, a system's galaxy). */
  parentId?: string
  position: Vec3
  /** Hex color used for the node's material/glow. */
  color: string
  /** Relative render size. */
  size: number
  /** 0–100 importance score, drives glow intensity + sorting. */
  importance: number
  /** Number of underlying memories represented by this node. */
  memoryCount: number
  /** Ids of semantically related nodes (denormalized for quick access). */
  relatedIds: string[]
  createdAt: string // ISO date
  updatedAt: string // ISO date
  tags: string[]
}

export interface MemoryEdge {
  id: string
  source: string // node id
  target: string // node id
  relation: RelationType
  /** 0–1 strength; affects line opacity/width. */
  weight: number
}

export interface MemoryGraph {
  nodes: MemoryNode[]
  edges: MemoryEdge[]
}

/** An animated agent and the path it patrols between nodes. */
export interface AgentEntity {
  id: string
  name: string
  role: string
  description: string
  color: string
  /** Ordered node ids the agent travels between. */
  path: string[]
  /** Orbit speed multiplier. */
  speed: number
}

/** A mock AI-generated insight surfaced in the Discoveries panel. */
export interface Discovery {
  id: string
  title: string
  detail: string
  /** Node ids this insight references (used to focus the camera). */
  nodeIds: string[]
  confidence: number // 0–1
}
