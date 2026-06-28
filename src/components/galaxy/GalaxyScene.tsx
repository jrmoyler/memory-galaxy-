import { useMemo } from 'react'
import { useGalaxyStore } from '@/store/useGalaxyStore'
import { useVisibleNodes } from '@/hooks/useMemoryGraph'
import { neighborsOf } from '@/lib/graphUtils'
import { StarField } from './StarField'
import { NebulaField } from './NebulaField'
import { GalaxyNode } from './GalaxyNode'
import { WormholeLine } from './WormholeLine'
import { AgentOrb } from './AgentOrb'
import { CameraRig } from './CameraRig'

/**
 * The full 3D scene graph: lights, starfield, nebula, relationship lanes,
 * nodes, and animated agents. Reads selection/hover/visibility from the store.
 */
export function GalaxyScene() {
  const { graph, byId, visibility } = useVisibleNodes()
  const selectedId = useGalaxyStore((s) => s.selectedId)
  const hoveredId = useGalaxyStore((s) => s.hoveredId)
  const selectNode = useGalaxyStore((s) => s.selectNode)
  const hoverNode = useGalaxyStore((s) => s.hoverNode)
  const agents = useGalaxyStore((s) => s.agents)

  // Node ids related to the current selection — their lanes light up.
  const activeNeighbors = useMemo(
    () => (selectedId ? neighborsOf(graph, selectedId) : new Set<string>()),
    [graph, selectedId],
  )

  // Resolve agent path positions once per graph change.
  const agentPoints = useMemo(
    () =>
      agents.map((a) => ({
        agent: a,
        points: a.path
          .map((id) => byId.get(id)?.position)
          .filter((p): p is NonNullable<typeof p> => Boolean(p)),
      })),
    [agents, byId],
  )

  return (
    <>
      {/* Lighting — cool ambient with a warm key for gold/teal contrast. */}
      <ambientLight intensity={0.35} />
      <pointLight position={[40, 40, 40]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-50, -20, -40]} intensity={0.6} color="#00D9B5" />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#D4A843" distance={120} />

      <StarField />
      <NebulaField />

      {/* Relationship lanes (wormholes) */}
      {graph.edges.map((edge) => {
        const from = byId.get(edge.source)
        const to = byId.get(edge.target)
        if (!from || !to) return null
        const vFrom = visibility.get(edge.source)?.opacity ?? 0
        const vTo = visibility.get(edge.target)?.opacity ?? 0
        const pairOpacity = Math.min(vFrom, vTo)
        if (pairOpacity < 0.05) return null
        const active =
          selectedId !== null &&
          (edge.source === selectedId || edge.target === selectedId)
        return (
          <WormholeLine
            key={edge.id}
            edge={edge}
            from={from.position}
            to={to.position}
            active={active}
            opacity={pairOpacity * (0.25 + edge.weight * 0.5)}
          />
        )
      })}

      {/* Nodes (agents are rendered separately as moving orbs) */}
      {graph.nodes.map((node) => {
        if (node.type === 'agent') return null
        const vis = visibility.get(node.id)
        if (!vis || vis.opacity < 0.02) return null
        const isHighlighted =
          hoveredId === node.id || activeNeighbors.has(node.id)
        return (
          <GalaxyNode
            key={node.id}
            node={node}
            selected={selectedId === node.id}
            hovered={isHighlighted}
            opacity={vis.opacity}
            onSelect={selectNode}
            onHover={hoverNode}
          />
        )
      })}

      {/* Animated AI agents */}
      {agentPoints.map(({ agent, points }) => (
        <AgentOrb
          key={agent.id}
          agent={agent}
          points={points}
          selected={selectedId === agent.id}
          onSelect={selectNode}
          onHover={hoverNode}
        />
      ))}

      <CameraRig />
    </>
  )
}
