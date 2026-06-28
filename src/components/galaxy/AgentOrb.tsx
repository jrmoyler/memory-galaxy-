import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Trail } from '@react-three/drei'
import * as THREE from 'three'
import type { AgentEntity, Vec3 } from '@/types/memory'
import { pointAlongPath } from '@/lib/graphUtils'

interface AgentOrbProps {
  agent: AgentEntity
  /** Resolved world positions of the agent's path node ids. */
  points: Vec3[]
  selected: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
}

/**
 * A small glowing drone/orb that patrols slowly between nodes along its path.
 * Movement is eased per-segment for organic motion, with a comet Trail.
 */
export function AgentOrb({ agent, points, selected, onSelect, onHover }: AgentOrbProps) {
  const group = useRef<THREE.Group>(null)
  const orb = useRef<THREE.Mesh>(null)
  const tRef = useRef(Math.random()) // stagger start so agents don't sync
  const c = new THREE.Color(agent.color)

  useFrame((state, delta) => {
    if (!group.current || points.length === 0) return
    tRef.current += delta * agent.speed
    const p = pointAlongPath(points, tRef.current)
    // Add a tiny bob so the orb feels alive.
    const bob = Math.sin(state.clock.elapsedTime * 2 + tRef.current * 6) * 0.4
    group.current.position.set(p.x, p.y + bob, p.z)
    if (orb.current) orb.current.rotation.y += delta * 1.5
  })

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(agent.id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHover(agent.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHover(null)
        document.body.style.cursor = 'auto'
      }}
    >
      <Trail width={2.2} length={5} color={c} attenuation={(w) => w * w} decay={1.2}>
        <mesh ref={orb}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial
            color={c}
            emissive={c}
            emissiveIntensity={selected ? 2.2 : 1.4}
            roughness={0.2}
            metalness={0.6}
            flatShading
          />
        </mesh>
      </Trail>

      {/* Glow shell */}
      <mesh scale={selected ? 2.4 : 1.8}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <Html center distanceFactor={18} position={[0, 1.4, 0]} zIndexRange={[20, 0]}>
        <div
          className="galaxy-label rounded-md px-2 py-0.5 text-[10px] font-medium glass"
          style={{ color: agent.color, borderColor: `${agent.color}66` }}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  )
}
