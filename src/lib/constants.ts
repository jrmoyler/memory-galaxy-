import type { NodeType } from '@/types/memory'

/** Brand palette — kept in sync with tailwind.config.ts. */
export const BRAND = {
  background: '#050A18',
  card: '#0D1326',
  gold: '#D4A843',
  teal: '#00D9B5',
  white: '#F5F5F5',
  silver: '#8B9BAE',
  border: '#1A2540',
} as const

/** Default accent color per node type, used when a node omits its own color. */
export const TYPE_COLOR: Record<NodeType, string> = {
  galaxy: '#D4A843',
  system: '#00D9B5',
  planet: '#5B8DEF',
  document: '#9D7BEA',
  concept: '#E0719C',
  fact: '#8B9BAE',
  agent: '#FFD66B',
}

/** Human-friendly labels per node type. */
export const TYPE_LABEL: Record<NodeType, string> = {
  galaxy: 'Galaxy',
  system: 'Solar System',
  planet: 'Planet',
  document: 'Document',
  concept: 'Concept',
  fact: 'Fact',
  agent: 'Agent',
}

/** Cosmic metaphor for each level, surfaced in the inspector. */
export const TYPE_METAPHOR: Record<NodeType, string> = {
  galaxy: 'Domain',
  system: 'Project',
  planet: 'Knowledge base',
  document: 'Document',
  concept: 'Concept',
  fact: 'Fact',
  agent: 'AI entity',
}

export const NODE_TYPES: NodeType[] = [
  'galaxy',
  'system',
  'planet',
  'document',
  'concept',
  'fact',
  'agent',
]

/** Mock AI action presets shown in the inspector. */
export const AI_ACTIONS = [
  { id: 'summarize', label: 'Summarize this memory cluster' },
  { id: 'related', label: 'Find related ideas' },
  { id: 'next-steps', label: 'Generate next steps' },
  { id: 'brief', label: 'Create project brief' },
  { id: 'export-md', label: 'Export as markdown' },
] as const

export type AiActionId = (typeof AI_ACTIONS)[number]['id']
