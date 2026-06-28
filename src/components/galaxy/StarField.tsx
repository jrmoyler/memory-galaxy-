import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import type { Group } from 'three'

/**
 * Layered starfield. drei's <Stars> gives us a dense, depth-sorted point cloud;
 * we slowly rotate the whole group for a subtle living-sky feel.
 */
export function StarField() {
  const group = useRef<Group>(null)

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.005
    }
  })

  return (
    <group ref={group}>
      <Stars radius={140} depth={70} count={6000} factor={4} saturation={0} fade speed={0.6} />
    </group>
  )
}
