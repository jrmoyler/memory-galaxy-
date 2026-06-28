import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { MemoryNode } from '@/types/memory'
import { toTuple } from '@/lib/graphUtils'
import { FRESNEL } from '@/lib/three/shaderChunks'
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

/* -------------------------------------------------------------------------- */
/* Crystalline small-node building blocks                                     */
/* -------------------------------------------------------------------------- */

/**
 * Fresnel rim shell. A transparent additive backside (or front) layer whose
 * brightness ramps toward the silhouette, giving small gems a luminous,
 * glassy edge that catches the bloom pass. Driven entirely on the GPU; the
 * only per-frame work is uploading the scalar uniforms in `useFrame`.
 */
const FRESNEL_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRESNEL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${FRESNEL}
  void main() {
    float rim = fresnel(vNormalW, vViewDir, uPower);
    gl_FragColor = vec4(uColor * rim * uIntensity, rim * uIntensity);
  }
`

function FresnelRim({
  color,
  power = 2.4,
  intensity = 1,
  side = THREE.FrontSide,
}: {
  color: THREE.Color
  power?: number
  intensity?: number
  side?: THREE.Side
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: color.clone() },
      uPower: { value: power },
      uIntensity: { value: intensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame(() => {
    if (!matRef.current) return
    const u = matRef.current.uniforms
    ;(u.uColor.value as THREE.Color).copy(color)
    u.uPower.value = power
    u.uIntensity.value = intensity
  })

  return (
    <shaderMaterial
      ref={matRef}
      vertexShader={FRESNEL_VERT}
      fragmentShader={FRESNEL_FRAG}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      side={side}
    />
  )
}

/**
 * `document` — a faceted, elongated data-crystal / page-shard. A tapered
 * (vertically stretched) octahedron core with a glassy refractive material,
 * an emissive inner core, a Fresnel rim, and a tiny sparkle point.
 */
function DocumentCrystal({
  c,
  size,
  emphasis,
}: {
  c: THREE.Color
  size: number
  emphasis: number
}) {
  const inner = useRef<THREE.Mesh>(null)
  // Elongated shard proportions: thin in X/Z, long in Y.
  const scale = useMemo<[number, number, number]>(
    () => [0.62, 1.55, 0.62],
    [],
  )

  useFrame((state) => {
    if (!inner.current) return
    // Faint twinkle of the emissive core.
    const t = state.clock.elapsedTime
    const mat = inner.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.55 + emphasis * 1.4 + Math.sin(t * 2.1) * 0.12
  })

  return (
    <group scale={scale}>
      {/* Faceted glassy shard */}
      <mesh ref={inner}>
        <octahedronGeometry args={[size * 1.05, 1]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.6 + emphasis * 1.4}
          roughness={0.12}
          metalness={0.1}
          transparent
          opacity={0.78}
          flatShading
        />
      </mesh>
      {/* Fresnel rim glow hugging the silhouette */}
      <mesh scale={1.08}>
        <octahedronGeometry args={[size * 1.05, 1]} />
        <FresnelRim color={c} power={2.0} intensity={0.9 + emphasis * 1.3} side={THREE.BackSide} />
      </mesh>
      {/* Bright sparkle at the tip */}
      <mesh position={[0, size * 0.95, 0]} scale={[1.6, 0.65, 1.6]}>
        <sphereGeometry args={[size * 0.28, 8, 8]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.5 + emphasis * 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

/**
 * `concept` — a luminous polyhedral idea-gem. A crisp faceted icosahedron with
 * a glowing wireframe edge accent over a flat-shaded emissive body and a
 * Fresnel rim, so it reads as a sharp, faceted crystal of thought.
 */
function ConceptGem({
  c,
  size,
  emphasis,
}: {
  c: THREE.Color
  size: number
  emphasis: number
}) {
  const body = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!body.current) return
    // Slow counter-spin on a tilted axis adds life beyond the parent rotation.
    body.current.rotation.x += delta * 0.25
    body.current.rotation.z -= delta * 0.12
  })

  return (
    <group>
      <mesh ref={body}>
        <icosahedronGeometry args={[size * 1.05, 0]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.45 + emphasis * 1.2}
          roughness={0.25}
          metalness={0.45}
          flatShading
        />
        {/* Glowing edge accent */}
        <mesh scale={1.012}>
          <icosahedronGeometry args={[size * 1.05, 0]} />
          <meshBasicMaterial
            color={c}
            wireframe
            transparent
            opacity={0.55 + emphasis * 0.45}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </mesh>
      {/* Fresnel rim */}
      <mesh scale={1.12}>
        <icosahedronGeometry args={[size * 1.05, 0]} />
        <FresnelRim color={c} power={2.6} intensity={0.8 + emphasis * 1.2} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

/**
 * `fact` — a tiny bright mote of star-dust: a small glowing sphere with a soft
 * additive halo and a gentle twinkle. Kept deliberately cheap.
 */
function FactMote({
  c,
  size,
  emphasis,
}: {
  c: THREE.Color
  size: number
  emphasis: number
}) {
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const twinkle = 0.5 + Math.sin(t * 3.3 + size * 10) * 0.5
    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.8 + emphasis * 1.6 + twinkle * 0.5
    }
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + emphasis * 0.25 + twinkle * 0.12
    }
  })

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[size * 0.62, 16, 16]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.9 + emphasis * 1.6}
          roughness={0.3}
          metalness={0.0}
        />
      </mesh>
      {/* Soft additive halo */}
      <mesh ref={halo} scale={2.4}>
        <sphereGeometry args={[size * 0.62, 12, 12]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.18 + emphasis * 0.25}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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
  const c = useMemo(() => new THREE.Color(color), [color])

  if (type === 'concept') return <ConceptGem c={c} size={size} emphasis={emphasis} />
  if (type === 'document') return <DocumentCrystal c={c} size={size} emphasis={emphasis} />
  return <FactMote c={c} size={size} emphasis={emphasis} />
}
