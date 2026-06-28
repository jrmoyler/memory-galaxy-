import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { MemoryNode } from '@/types/memory'
import { toTuple } from '@/lib/graphUtils'
import { PlanetNode } from './PlanetNode'
import { SolarSystemNode } from './SolarSystemNode'

interface GalaxyNodeProps {
  node: MemoryNode
  selected: boolean
  hovered: boolean
  /** Dimmed by filters/timeline. */
  opacity: number
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/**
 * Interactive node. Owns pointer events, the hover label, the animated
 * rotation, and the selection pulse. Delegates the actual mesh to a
 * type-specific component (PlanetNode / SolarSystemNode / small primitive).
 */
export function GalaxyNode({
  node,
  selected,
  hovered,
  opacity,
  onSelect,
  onHover,
}: GalaxyNodeProps) {
  const group = useRef<THREE.Group>(null)
  const [localHover, setLocalHover] = useState(false)
  const emphasis = selected ? 1 : hovered || localHover ? 0.6 : 0

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * 0.15
    if (selected) {
      // Gentle pulse on the selected node.
      const t = state.clock.elapsedTime
      const s = 1 + Math.sin(t * 3) * 0.05
      group.current.scale.setScalar(s)
    } else {
      group.current.scale.setScalar(1)
    }
  })

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(node.id)
  }
  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setLocalHover(true)
    onHover(node.id)
    document.body.style.cursor = 'pointer'
  }
  const handleOut = () => {
    setLocalHover(false)
    onHover(null)
    document.body.style.cursor = 'auto'
  }

  const isStar = node.type === 'galaxy' || node.type === 'system'
  const isPlanet = node.type === 'planet'
  const showLabel = selected || hovered || localHover || isStar
  const labelVisible = opacity > 0.2 && showLabel

  return (
    <group position={toTuple(node.position)}>
      <group
        ref={group}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
        visible={opacity > 0.02}
      >
        {isStar ? (
          <SolarSystemNode color={node.color} size={node.size} emphasis={emphasis} />
        ) : isPlanet ? (
          <PlanetNode
            color={node.color}
            size={node.size}
            emphasis={emphasis}
            withRing={node.importance > 85}
          />
        ) : (
          <SmallNode color={node.color} size={node.size} emphasis={emphasis} type={node.type} />
        )}

        {/* Selection halo ring */}
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[node.size * 2.2, node.size * 2.5, 64]} />
            <meshBasicMaterial color="#D4A843" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {labelVisible && (
        <Html center distanceFactor={isStar ? 26 : 16} position={[0, node.size * 1.8 + 1, 0]} zIndexRange={[20, 0]}>
          <div
            className="galaxy-label rounded-md px-2 py-0.5 text-[11px] font-medium glass"
            style={{
              color: node.color,
              borderColor: `${node.color}66`,
              opacity: Math.min(1, opacity + 0.2),
            }}
          >
            {node.name}
          </div>
        </Html>
      )}
    </group>
  )
}

/** Small primitive used for documents, concepts, and facts. */
function SmallNode({
  color,
  size,
  emphasis,
  type,
}: {
  color: string
  size: number
  emphasis: number
  type: MemoryNode['type']
}) {
  const c = new THREE.Color(color)
  return (
    <group>
      <mesh>
        {type === 'concept' ? (
          <octahedronGeometry args={[size, 0]} />
        ) : type === 'document' ? (
          <boxGeometry args={[size * 1.3, size * 1.3, size * 1.3]} />
        ) : (
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.4 + emphasis * 0.9}
          roughness={0.4}
          metalness={0.3}
          flatShading={type === 'concept'}
        />
      </mesh>
      <mesh scale={1.5}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.1 + emphasis * 0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
