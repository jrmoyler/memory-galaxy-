import * as THREE from 'three'

interface PlanetMeshProps {
  color: string
  size: number
  emphasis: number // 0..1 glow boost from hover/selection
  withRing?: boolean
}

/**
 * A glowing planet: a lit sphere wrapped in an additive backside "atmosphere"
 * shell. Real three.js geometry + materials — no sprites or SVGs.
 */
export function PlanetNode({ color, size, emphasis, withRing }: PlanetMeshProps) {
  const c = new THREE.Color(color)
  return (
    <group>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={c}
          emissive={c}
          emissiveIntensity={0.35 + emphasis * 0.9}
          roughness={0.45}
          metalness={0.25}
        />
      </mesh>

      {/* Atmosphere glow (backside additive shell) */}
      <mesh scale={1.35 + emphasis * 0.25}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial
          color={c}
          transparent
          opacity={0.12 + emphasis * 0.22}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {withRing && (
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 1.9, 48]} />
          <meshBasicMaterial
            color={c}
            transparent
            opacity={0.25 + emphasis * 0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
