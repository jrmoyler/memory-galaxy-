import type {
  AgentEntity,
  Discovery,
  MemoryEdge,
  MemoryGraph,
  MemoryNode,
  NodeType,
  RelationType,
  Vec3,
} from '@/types/memory'
import { TYPE_COLOR } from '@/lib/constants'

/**
 * Mock knowledge graph for Memory Galaxy V1.
 *
 * This is intentionally rich (38 nodes / 45 relationships) so the galaxy feels
 * alive on first run. In V2 this module is replaced by a Supabase-backed query
 * (see README → "Future Supabase schema idea"). The shape matches `memoryGraphSchema`.
 *
 * No secrets are referenced — only public-facing product/concept names.
 */

interface NodeSpec {
  id: string
  name: string
  type: NodeType
  description: string
  category: string
  parentId?: string
  position: Vec3
  color?: string
  size?: number
  importance: number
  memoryCount: number
  related?: string[]
  created: string
  updated: string
  tags: string[]
}

function node(spec: NodeSpec): MemoryNode {
  return {
    id: spec.id,
    name: spec.name,
    type: spec.type,
    description: spec.description,
    category: spec.category,
    parentId: spec.parentId,
    position: spec.position,
    color: spec.color ?? TYPE_COLOR[spec.type],
    size: spec.size ?? defaultSize(spec.type),
    importance: spec.importance,
    memoryCount: spec.memoryCount,
    relatedIds: spec.related ?? [],
    createdAt: spec.created,
    updatedAt: spec.updated,
    tags: spec.tags,
  }
}

function defaultSize(type: NodeType): number {
  switch (type) {
    case 'galaxy':
      return 6
    case 'system':
      return 3.2
    case 'planet':
      return 1.8
    case 'document':
      return 1.1
    case 'concept':
      return 0.9
    case 'fact':
      return 0.6
    case 'agent':
      return 0.7
  }
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z })

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

const nodes: MemoryNode[] = [
  // ===== Galaxies (domains) =====
  node({
    id: 'g-collective',
    name: 'Collective AI Inc',
    type: 'galaxy',
    description:
      'Flagship galaxy housing the Collective AI Inc product constellation — autonomous agent systems, hybrid living, and frontier research.',
    category: 'Organization',
    position: v(0, 0, 0),
    importance: 100,
    memoryCount: 1240,
    related: ['g-research'],
    created: '2024-01-04',
    updated: '2026-06-20',
    tags: ['org', 'flagship', 'ai'],
  }),
  node({
    id: 'g-personal',
    name: 'Personal Life Galaxy',
    type: 'galaxy',
    description:
      'A private galaxy of personal knowledge — journals, health, learning, and life projects.',
    category: 'Personal',
    position: v(-62, 12, -34),
    importance: 70,
    memoryCount: 320,
    created: '2024-03-12',
    updated: '2026-06-18',
    tags: ['personal', 'life'],
  }),
  node({
    id: 'g-research',
    name: 'Research Galaxy',
    type: 'galaxy',
    description:
      'Open research galaxy — papers, experiments, and vector-search explorations feeding the product lines.',
    category: 'Research',
    position: v(58, -10, -42),
    importance: 82,
    memoryCount: 540,
    related: ['g-collective'],
    created: '2024-02-08',
    updated: '2026-06-22',
    tags: ['research', 'science'],
  }),

  // ===== Systems (projects) inside Collective AI Inc =====
  node({
    id: 's-zenflow',
    name: 'ZenFlow System',
    type: 'system',
    description:
      'Autonomous agent operating environment orchestrating a 600-agent lattice for end-to-end workflows.',
    category: 'Agent Systems',
    parentId: 'g-collective',
    position: v(14, 5, 9),
    importance: 96,
    memoryCount: 410,
    related: ['s-hybrid', 's-nexus'],
    created: '2024-04-01',
    updated: '2026-06-21',
    tags: ['zenflow', 'agents', 'orchestration'],
  }),
  node({
    id: 's-hybrid',
    name: 'Hybrid Living System',
    type: 'system',
    description:
      'AI-augmented living platform spanning education, wellness, and focus tooling for everyday humans.',
    category: 'Consumer',
    parentId: 'g-collective',
    position: v(-16, 3, 7),
    importance: 88,
    memoryCount: 300,
    related: ['s-zenflow'],
    created: '2024-05-19',
    updated: '2026-06-17',
    tags: ['hybrid-living', 'consumer', 'wellness'],
  }),
  node({
    id: 's-nexus',
    name: 'Nexus Labs System',
    type: 'system',
    description:
      'Content and signal intelligence lab — high-velocity media systems and the shared knowledge graph.',
    category: 'Labs',
    parentId: 'g-collective',
    position: v(9, -7, -13),
    importance: 84,
    memoryCount: 260,
    related: ['s-terra'],
    created: '2024-06-02',
    updated: '2026-06-19',
    tags: ['nexus', 'content', 'signal'],
  }),
  node({
    id: 's-terra',
    name: 'Terra Axis System',
    type: 'system',
    description:
      'Trust, governance, and security backbone — Quantum Ledger settlement and the Aegis Protocol.',
    category: 'Infrastructure',
    parentId: 'g-collective',
    position: v(-11, -5, -15),
    importance: 86,
    memoryCount: 230,
    related: ['s-zenflow'],
    created: '2024-06-21',
    updated: '2026-06-15',
    tags: ['terra-axis', 'security', 'governance'],
  }),

  // ===== Planets in ZenFlow =====
  node({
    id: 'p-agentos',
    name: 'Agent OS Planet',
    type: 'planet',
    description:
      'The runtime kernel scheduling, supervising, and recovering autonomous agents across the lattice.',
    category: 'Runtime',
    parentId: 's-zenflow',
    position: v(20, 7, 12),
    importance: 92,
    memoryCount: 180,
    related: ['p-memory-arch', 'p-tool-router', 'c-600-lattice', 'c-exec-state'],
    created: '2024-07-09',
    updated: '2026-06-20',
    tags: ['runtime', 'kernel', 'agents'],
  }),
  node({
    id: 'p-memory-arch',
    name: 'Memory Architecture Planet',
    type: 'planet',
    description:
      'Layered memory subsystem — vector memory, episodic logs, and the governing Memory Constitution.',
    category: 'Memory',
    parentId: 's-zenflow',
    position: v(17, 9, 4),
    importance: 94,
    memoryCount: 210,
    related: ['p-tool-router', 'c-memory-constitution', 'c-vector-memory'],
    created: '2024-07-15',
    updated: '2026-06-21',
    tags: ['memory', 'architecture', 'vector'],
  }),
  node({
    id: 'p-tool-router',
    name: 'Tool Router Planet',
    type: 'planet',
    description:
      'Sub-50ms semantic router selecting the right tool/agent for any request across the lattice.',
    category: 'Routing',
    parentId: 's-zenflow',
    position: v(11, 3, 14),
    importance: 90,
    memoryCount: 160,
    related: ['p-agentos', 'p-knowledge-graph', 'c-vector-memory'],
    created: '2024-08-02',
    updated: '2026-06-18',
    tags: ['routing', 'tools', 'latency'],
  }),

  // ===== Planets in Hybrid Living =====
  node({
    id: 'p-ai-edu',
    name: 'AI Education Planet',
    type: 'planet',
    description:
      'Adaptive tutoring and curriculum generation powered by the shared memory architecture.',
    category: 'Education',
    parentId: 's-hybrid',
    position: v(-22, 5, 10),
    importance: 80,
    memoryCount: 140,
    related: ['p-memory-arch', 'p-focusflow'],
    created: '2024-08-20',
    updated: '2026-06-14',
    tags: ['education', 'tutoring'],
  }),
  node({
    id: 'p-wellness',
    name: 'Wellness Systems Planet',
    type: 'planet',
    description:
      'Personalized wellness coaching — sleep, recovery, and stress signals fused into daily guidance.',
    category: 'Wellness',
    parentId: 's-hybrid',
    position: v(-19, 1, 3),
    importance: 76,
    memoryCount: 120,
    related: ['p-focusflow'],
    created: '2024-09-01',
    updated: '2026-06-12',
    tags: ['wellness', 'health', 'coaching'],
  }),
  node({
    id: 'p-focusflow',
    name: 'FocusFlow Planet',
    type: 'planet',
    description:
      'Attention and deep-work engine that schedules focus blocks around energy and priorities.',
    category: 'Productivity',
    parentId: 's-hybrid',
    position: v(-14, 6, 11),
    importance: 78,
    memoryCount: 130,
    related: ['p-ai-edu', 'p-wellness'],
    created: '2024-09-18',
    updated: '2026-06-16',
    tags: ['focus', 'productivity'],
  }),

  // ===== Planets in Nexus Labs =====
  node({
    id: 'p-signal-velocity',
    name: 'Signal Velocity Planet',
    type: 'planet',
    description:
      'Real-time content workflow that turns raw signal into published media at high velocity.',
    category: 'Content',
    parentId: 's-nexus',
    position: v(13, -9, -17),
    importance: 79,
    memoryCount: 110,
    related: ['p-knowledge-graph'],
    created: '2024-10-05',
    updated: '2026-06-13',
    tags: ['content', 'media', 'workflow'],
  }),
  node({
    id: 'p-knowledge-graph',
    name: 'Knowledge Graph Planet',
    type: 'planet',
    description:
      'The shared entity graph linking every concept, document, and fact across Collective AI Inc.',
    category: 'Knowledge',
    parentId: 's-nexus',
    position: v(6, -4, -18),
    importance: 89,
    memoryCount: 200,
    related: ['p-memory-arch', 'p-tool-router', 'c-vector-memory'],
    created: '2024-10-22',
    updated: '2026-06-19',
    tags: ['graph', 'knowledge', 'entities'],
  }),

  // ===== Planets in Terra Axis =====
  node({
    id: 'p-quantum-ledger',
    name: 'Quantum Ledger Planet',
    type: 'planet',
    description:
      'Tamper-evident settlement ledger recording agent actions and value transfers.',
    category: 'Ledger',
    parentId: 's-terra',
    position: v(-15, -7, -18),
    importance: 81,
    memoryCount: 95,
    related: ['p-aegis'],
    created: '2024-11-03',
    updated: '2026-06-11',
    tags: ['ledger', 'settlement', 'audit'],
  }),
  node({
    id: 'p-aegis',
    name: 'Aegis Protocol Planet',
    type: 'planet',
    description:
      'Policy and safety layer enforcing the Memory Constitution and guarding agent autonomy.',
    category: 'Security',
    parentId: 's-terra',
    position: v(-8, -3, -19),
    importance: 87,
    memoryCount: 105,
    related: ['p-quantum-ledger', 'c-memory-constitution', 'c-hataalii'],
    created: '2024-11-20',
    updated: '2026-06-20',
    tags: ['security', 'policy', 'safety'],
  }),

  // ===== Concepts (buildings) =====
  node({
    id: 'c-600-lattice',
    name: '600-Agent Lattice',
    type: 'concept',
    description:
      'The topology coordinating up to 600 concurrent agents with shared memory and routing.',
    category: 'Architecture',
    parentId: 'p-agentos',
    position: v(23, 8, 13),
    importance: 91,
    memoryCount: 64,
    related: ['c-exec-state', 'p-tool-router'],
    created: '2025-01-10',
    updated: '2026-06-21',
    tags: ['lattice', 'scale', 'topology'],
  }),
  node({
    id: 'c-exec-state',
    name: 'Executive State Engine',
    type: 'concept',
    description:
      'Maintains global goals, priorities, and the working state shared across the lattice.',
    category: 'Architecture',
    parentId: 'p-agentos',
    position: v(21, 10, 9),
    importance: 85,
    memoryCount: 48,
    related: ['c-600-lattice'],
    created: '2025-02-02',
    updated: '2026-06-17',
    tags: ['state', 'planning', 'executive'],
  }),
  node({
    id: 'c-memory-constitution',
    name: 'Memory Constitution',
    type: 'concept',
    description:
      'The governing ruleset for what agents remember, forget, and may never store.',
    category: 'Governance',
    parentId: 'p-memory-arch',
    position: v(19, 11, 1),
    importance: 90,
    memoryCount: 52,
    related: ['c-vector-memory', 'p-aegis'],
    created: '2025-02-18',
    updated: '2026-06-22',
    tags: ['governance', 'memory', 'policy'],
  }),
  node({
    id: 'c-vector-memory',
    name: 'Vector Memory',
    type: 'concept',
    description:
      'Embedding-based long-term memory store enabling semantic recall across agents.',
    category: 'Memory',
    parentId: 'p-memory-arch',
    position: v(15, 12, 6),
    importance: 88,
    memoryCount: 71,
    related: ['c-memory-constitution', 'p-knowledge-graph', 'c-vector-search'],
    created: '2025-03-04',
    updated: '2026-06-19',
    tags: ['vector', 'embeddings', 'recall'],
  }),
  node({
    id: 'c-hataalii',
    name: 'HATAALII',
    type: 'concept',
    description:
      'Guardian protocol pattern within Aegis — ceremonial checks that keep agents aligned to intent.',
    category: 'Safety',
    parentId: 'p-aegis',
    position: v(-6, -2, -21),
    importance: 83,
    memoryCount: 38,
    related: ['c-memory-constitution'],
    created: '2025-03-22',
    updated: '2026-06-15',
    tags: ['safety', 'alignment', 'guardian'],
  }),
  node({
    id: 'c-vector-search',
    name: 'Vector Search',
    type: 'concept',
    description:
      'Approximate nearest-neighbor search underpinning recall in the research galaxy.',
    category: 'Retrieval',
    parentId: 'p-research-experiments',
    position: v(60, -6, -38),
    importance: 77,
    memoryCount: 44,
    related: ['c-vector-memory'],
    created: '2025-04-09',
    updated: '2026-06-18',
    tags: ['search', 'ann', 'retrieval'],
  }),

  // ===== Documents (cities) =====
  node({
    id: 'd-zenflow-spec',
    name: 'ZenFlow System Spec',
    type: 'document',
    description:
      'The canonical specification describing ZenFlow orchestration, lifecycles, and SLAs.',
    category: 'Specification',
    parentId: 's-zenflow',
    position: v(18, 4, 16),
    importance: 74,
    memoryCount: 1,
    related: ['p-agentos', 'c-600-lattice'],
    created: '2025-05-01',
    updated: '2026-05-28',
    tags: ['spec', 'doc', 'zenflow'],
  }),
  node({
    id: 'd-lattice-paper',
    name: '600-Agent Lattice Whitepaper',
    type: 'document',
    description:
      'Whitepaper detailing the lattice topology, fault tolerance, and scaling results.',
    category: 'Whitepaper',
    parentId: 'p-agentos',
    position: v(25, 6, 11),
    importance: 72,
    memoryCount: 1,
    related: ['c-600-lattice', 'c-exec-state'],
    created: '2025-06-12',
    updated: '2026-04-30',
    tags: ['whitepaper', 'lattice'],
  }),
  node({
    id: 'd-memory-constitution-doc',
    name: 'Memory Constitution v3',
    type: 'document',
    description:
      'The third revision of the Memory Constitution governing retention and forgetting.',
    category: 'Policy',
    parentId: 'p-memory-arch',
    position: v(16, 13, 3),
    importance: 73,
    memoryCount: 1,
    related: ['c-memory-constitution', 'p-aegis'],
    created: '2025-07-08',
    updated: '2026-06-22',
    tags: ['policy', 'doc', 'memory'],
  }),

  // ===== Facts (citizens) =====
  node({
    id: 'f-agents-count',
    name: '600 concurrent agents',
    type: 'fact',
    description: 'ZenFlow sustains up to 600 concurrent autonomous agents in production.',
    category: 'Metric',
    parentId: 'c-600-lattice',
    position: v(24, 9, 14),
    importance: 60,
    memoryCount: 1,
    related: ['c-600-lattice'],
    created: '2025-08-15',
    updated: '2026-06-21',
    tags: ['metric', 'scale'],
  }),
  node({
    id: 'f-latency',
    name: 'Sub-50ms tool routing',
    type: 'fact',
    description: 'The Tool Router resolves tool selection in under 50 milliseconds at p95.',
    category: 'Metric',
    parentId: 'p-tool-router',
    position: v(10, 2, 16),
    importance: 58,
    memoryCount: 1,
    related: ['p-tool-router'],
    created: '2025-09-01',
    updated: '2026-06-18',
    tags: ['metric', 'latency'],
  }),
  node({
    id: 'f-uptime',
    name: '99.98% lattice uptime',
    type: 'fact',
    description: 'The Agent OS lattice maintained 99.98% uptime over the trailing 12 months.',
    category: 'Metric',
    parentId: 'p-agentos',
    position: v(22, 5, 15),
    importance: 59,
    memoryCount: 1,
    related: ['p-agentos'],
    created: '2025-10-20',
    updated: '2026-06-20',
    tags: ['metric', 'reliability'],
  }),

  // ===== Personal Life galaxy =====
  node({
    id: 's-personal-projects',
    name: 'Life Projects System',
    type: 'system',
    description: 'Ongoing personal projects, journaling, and learning goals.',
    category: 'Personal',
    parentId: 'g-personal',
    position: v(-58, 14, -30),
    importance: 64,
    memoryCount: 90,
    related: ['p-journal', 'p-fitness'],
    created: '2024-04-14',
    updated: '2026-06-10',
    tags: ['personal', 'projects'],
  }),
  node({
    id: 'p-journal',
    name: 'Journal Planet',
    type: 'planet',
    description: 'Daily journals, reflections, and gratitude notes.',
    category: 'Journal',
    parentId: 's-personal-projects',
    position: v(-54, 16, -27),
    importance: 56,
    memoryCount: 50,
    related: ['p-fitness'],
    created: '2024-05-02',
    updated: '2026-06-09',
    tags: ['journal', 'reflection'],
  }),
  node({
    id: 'p-fitness',
    name: 'Fitness Planet',
    type: 'planet',
    description: 'Training logs, recovery, and nutrition tracking.',
    category: 'Health',
    parentId: 's-personal-projects',
    position: v(-61, 10, -31),
    importance: 54,
    memoryCount: 40,
    related: ['p-wellness'],
    created: '2024-06-11',
    updated: '2026-06-08',
    tags: ['fitness', 'health'],
  }),

  // ===== Research galaxy =====
  node({
    id: 's-research-ml',
    name: 'ML Research System',
    type: 'system',
    description: 'Machine-learning research threads feeding Collective AI Inc product lines.',
    category: 'Research',
    parentId: 'g-research',
    position: v(54, -8, -39),
    importance: 80,
    memoryCount: 220,
    related: ['p-research-papers', 'p-research-experiments'],
    created: '2024-03-01',
    updated: '2026-06-22',
    tags: ['ml', 'research'],
  }),
  node({
    id: 'p-research-papers',
    name: 'Papers Planet',
    type: 'planet',
    description: 'Curated and annotated papers across retrieval, memory, and agents.',
    category: 'Literature',
    parentId: 's-research-ml',
    position: v(51, -6, -36),
    importance: 70,
    memoryCount: 120,
    related: ['p-research-experiments'],
    created: '2024-03-18',
    updated: '2026-06-20',
    tags: ['papers', 'literature'],
  }),
  node({
    id: 'p-research-experiments',
    name: 'Experiments Planet',
    type: 'planet',
    description: 'Reproducible experiments validating vector search and memory recall.',
    category: 'Experiments',
    parentId: 's-research-ml',
    position: v(57, -10, -40),
    importance: 73,
    memoryCount: 100,
    related: ['c-vector-search', 'p-research-papers'],
    created: '2024-04-02',
    updated: '2026-06-21',
    tags: ['experiments', 'eval'],
  }),

  // ===== Agents (animated AI entities, also graph nodes) =====
  node({
    id: 'a-hermes',
    name: 'Hermes Agent',
    type: 'agent',
    description: 'Messenger agent ferrying updates and summaries between systems.',
    category: 'Agent',
    parentId: 'g-collective',
    position: v(14, 5, 9),
    importance: 66,
    memoryCount: 0,
    related: ['s-zenflow', 's-hybrid', 's-nexus'],
    created: '2025-01-05',
    updated: '2026-06-22',
    tags: ['agent', 'messenger'],
  }),
  node({
    id: 'a-memory-keeper',
    name: 'Memory Keeper Agent',
    type: 'agent',
    description: 'Archive guardian curating, compacting, and protecting long-term memory.',
    category: 'Agent',
    parentId: 's-zenflow',
    position: v(17, 9, 4),
    importance: 68,
    memoryCount: 0,
    related: ['p-memory-arch', 'c-memory-constitution', 'p-knowledge-graph'],
    created: '2025-01-22',
    updated: '2026-06-22',
    tags: ['agent', 'archive', 'guardian'],
  }),
  node({
    id: 'a-research-agent',
    name: 'Research Agent',
    type: 'agent',
    description: 'Observatory scout scanning the research galaxy for relevant findings.',
    category: 'Agent',
    parentId: 'g-research',
    position: v(54, -8, -39),
    importance: 65,
    memoryCount: 0,
    related: ['p-research-papers', 'p-research-experiments', 'c-vector-search'],
    created: '2025-02-11',
    updated: '2026-06-22',
    tags: ['agent', 'research', 'scout'],
  }),
]

// ---------------------------------------------------------------------------
// Edges (semantic relationships → rendered as wormholes / hyperspace lanes)
// ---------------------------------------------------------------------------

let edgeSeq = 0
function edge(source: string, target: string, relation: RelationType, weight = 0.6): MemoryEdge {
  edgeSeq += 1
  return { id: `e${edgeSeq}`, source, target, relation, weight }
}

const edges: MemoryEdge[] = [
  // Galaxy ↔ galaxy
  edge('g-collective', 'g-research', 'related-to', 0.7),

  // Galaxy → systems (containment-as-relationship)
  edge('g-collective', 's-zenflow', 'powers', 0.9),
  edge('g-collective', 's-hybrid', 'powers', 0.8),
  edge('g-collective', 's-nexus', 'powers', 0.8),
  edge('g-collective', 's-terra', 'powers', 0.8),
  edge('g-personal', 's-personal-projects', 'powers', 0.7),
  edge('g-research', 's-research-ml', 'powers', 0.85),

  // System → planets
  edge('s-zenflow', 'p-agentos', 'powers', 0.9),
  edge('s-zenflow', 'p-memory-arch', 'powers', 0.9),
  edge('s-zenflow', 'p-tool-router', 'powers', 0.85),
  edge('s-hybrid', 'p-ai-edu', 'powers', 0.8),
  edge('s-hybrid', 'p-wellness', 'powers', 0.78),
  edge('s-hybrid', 'p-focusflow', 'powers', 0.8),
  edge('s-nexus', 'p-signal-velocity', 'powers', 0.8),
  edge('s-nexus', 'p-knowledge-graph', 'powers', 0.85),
  edge('s-terra', 'p-quantum-ledger', 'powers', 0.8),
  edge('s-terra', 'p-aegis', 'powers', 0.82),
  edge('s-personal-projects', 'p-journal', 'powers', 0.6),
  edge('s-personal-projects', 'p-fitness', 'powers', 0.6),
  edge('s-research-ml', 'p-research-papers', 'powers', 0.8),
  edge('s-research-ml', 'p-research-experiments', 'powers', 0.82),

  // Planet → concepts/docs/facts
  edge('p-agentos', 'c-600-lattice', 'references', 0.8),
  edge('p-agentos', 'c-exec-state', 'references', 0.75),
  edge('p-agentos', 'f-uptime', 'references', 0.5),
  edge('p-agentos', 'd-lattice-paper', 'references', 0.6),
  edge('p-memory-arch', 'c-memory-constitution', 'references', 0.85),
  edge('p-memory-arch', 'c-vector-memory', 'references', 0.85),
  edge('p-memory-arch', 'd-memory-constitution-doc', 'references', 0.6),
  edge('p-tool-router', 'f-latency', 'references', 0.5),
  edge('p-aegis', 'c-hataalii', 'references', 0.7),
  edge('p-research-experiments', 'c-vector-search', 'references', 0.7),
  edge('c-600-lattice', 'f-agents-count', 'references', 0.5),
  edge('c-600-lattice', 'd-zenflow-spec', 'derives-from', 0.55),

  // Cross-cutting semantic relationships (the interesting ones)
  edge('p-tool-router', 'p-knowledge-graph', 'depends-on', 0.7),
  edge('p-memory-arch', 'p-knowledge-graph', 'related-to', 0.7),
  edge('c-vector-memory', 'p-knowledge-graph', 'powers', 0.75),
  edge('c-vector-memory', 'c-vector-search', 'related-to', 0.8),
  edge('c-memory-constitution', 'p-aegis', 'powers', 0.8),
  edge('c-hataalii', 'c-memory-constitution', 'derives-from', 0.6),
  edge('p-ai-edu', 'p-memory-arch', 'depends-on', 0.65),
  edge('s-hybrid', 's-zenflow', 'depends-on', 0.7),
  edge('s-nexus', 'p-signal-velocity', 'related-to', 0.5),
  edge('p-aegis', 'p-quantum-ledger', 'depends-on', 0.6),
  edge('p-research-experiments', 'c-vector-memory', 'related-to', 0.65),
  edge('p-research-papers', 'p-research-experiments', 'related-to', 0.6),
  edge('p-wellness', 'p-fitness', 'related-to', 0.5),
  edge('p-focusflow', 'p-ai-edu', 'related-to', 0.55),

  // Agent patrol relationships
  edge('a-hermes', 's-zenflow', 'related-to', 0.4),
  edge('a-memory-keeper', 'p-memory-arch', 'related-to', 0.4),
  edge('a-research-agent', 'p-research-papers', 'related-to', 0.4),
]

export const mockMemoryGraph: MemoryGraph = { nodes, edges }

// ---------------------------------------------------------------------------
// Animated agents (their patrol paths reference node ids)
// ---------------------------------------------------------------------------

export const mockAgents: AgentEntity[] = [
  {
    id: 'a-hermes',
    name: 'Hermes Agent',
    role: 'Messenger',
    description: 'Ferries updates and summaries between the core systems.',
    color: '#FFD66B',
    path: ['s-zenflow', 's-hybrid', 's-nexus', 's-terra'],
    speed: 0.05,
  },
  {
    id: 'a-memory-keeper',
    name: 'Memory Keeper Agent',
    role: 'Archive Guardian',
    description: 'Curates and protects long-term memory across the lattice.',
    color: '#00D9B5',
    path: ['p-memory-arch', 'c-memory-constitution', 'p-knowledge-graph', 'c-vector-memory'],
    speed: 0.04,
  },
  {
    id: 'a-research-agent',
    name: 'Research Agent',
    role: 'Observatory Scout',
    description: 'Scans the research galaxy for relevant findings.',
    color: '#9D7BEA',
    path: ['p-research-papers', 'p-research-experiments', 'c-vector-search'],
    speed: 0.045,
  },
]

// ---------------------------------------------------------------------------
// Mock AI-generated discoveries (Constellation Discovery panel)
// ---------------------------------------------------------------------------

export const mockDiscoveries: Discovery[] = [
  {
    id: 'disc-1',
    title: 'Shared dependency on Memory Architecture',
    detail:
      'ZenFlow and Hybrid Living both depend on Memory Architecture — consolidating it would reduce duplicated memory tooling.',
    nodeIds: ['s-zenflow', 's-hybrid', 'p-memory-arch'],
    confidence: 0.86,
  },
  {
    id: 'disc-2',
    title: 'Nexus Labs could reuse Signal Velocity',
    detail:
      'Nexus Labs content systems could reuse Signal Velocity workflows to cut time-to-publish.',
    nodeIds: ['s-nexus', 'p-signal-velocity'],
    confidence: 0.74,
  },
  {
    id: 'disc-3',
    title: 'Tool Router is a high-importance hub',
    detail:
      'Tool Router Planet is connected to 5 high-importance concepts and sits on the critical routing path.',
    nodeIds: ['p-tool-router', 'p-knowledge-graph', 'c-vector-memory'],
    confidence: 0.91,
  },
  {
    id: 'disc-4',
    title: 'Vector Memory bridges product and research',
    detail:
      'Vector Memory links the product Knowledge Graph with the Research galaxy’s Vector Search — a strong transfer opportunity.',
    nodeIds: ['c-vector-memory', 'p-knowledge-graph', 'c-vector-search'],
    confidence: 0.82,
  },
  {
    id: 'disc-5',
    title: 'Governance concentrates in Terra Axis',
    detail:
      'The Memory Constitution and HATAALII both anchor to Aegis Protocol, concentrating governance in Terra Axis.',
    nodeIds: ['c-memory-constitution', 'c-hataalii', 'p-aegis'],
    confidence: 0.79,
  },
]
