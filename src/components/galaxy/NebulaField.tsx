import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface NebulaFieldProps {
  count?: number
  radius?: number
}

/**
 * Procedural nebula: a large, slowly-drifting cloud of additive-blended points
 * tinted between teal and gold. Built from raw BufferGeometry (no SVGs) so it
 * stays cheap and renders as real GPU points.
 */
export function NebulaField({ count = 1400, radius = 90 }: NebulaFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const teal = new THREE.Color('#00D9B5')
    const gold = new THREE.Color('#D4A843')
    const violet = new THREE.Color('#5B3F8F')

    for (let i = 0; i < count; i++) {
      // Cluster points into a flattened disc with some vertical spread.
      const r = Math.pow(Math.random(), 0.6) * radius
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * radius * 0.35
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(theta) * r

      // Blend colors by distance for a cosmic gradient.
      const t = r / radius
      const base = t < 0.5 ? teal.clone().lerp(violet, t * 2) : violet.clone().lerp(gold, (t - 0.5) * 2)
      colors[i * 3] = base.r
      colors[i * 3 + 1] = base.g
      colors[i * 3 + 2] = base.b
    }
    return { positions, colors }
  }, [count, radius])

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.012
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.6}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
