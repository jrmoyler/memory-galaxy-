import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SolarSystemMeshProps {
  color: string
  size: number
  emphasis: number
}

/**
 * A solar-system / star core: a bright emissive sphere with a rotating corona
 * ring and a soft additive halo. Used for `system` and `galaxy` node types.
 */
export function SolarSystemNode({ color, size, emphasis }: SolarSystemMeshProps) {
  const ring = useRef<THREE.Mesh>(null)
  const c = new THREE.Color(color)

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.4
  })

  return (
    <group>
      {/* Star core */}
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={1.1 + emphasis * 0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Inner halo */}
      <mesh scale={1.5}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.18 + emphasis * 0.2}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Corona ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.6, 0, 0]}>
        <ringGeometry args={[size * 1.7, size * 2.1, 64]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.3 + emphasis * 0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
