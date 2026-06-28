import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import type { MemoryEdge, Vec3 } from '@/types/memory'

interface WormholeLineProps {
  edge: MemoryEdge
  from: Vec3
  to: Vec3
  active: boolean
  opacity: number
}

/**
 * A semantic relationship rendered as a glowing curved "hyperspace lane".
 * We arc the line slightly off the straight path so overlapping edges read as
 * distinct lanes rather than a flat web.
 */
export function WormholeLine({ from, to, active, opacity }: WormholeLineProps) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(from.x, from.y, from.z)
    const end = new THREE.Vector3(to.x, to.y, to.z)
    const mid = start.clone().lerp(end, 0.5)
    // Push the midpoint outward to create a gentle arc.
    const dir = mid.clone().normalize()
    const lift = start.distanceTo(end) * 0.12
    mid.add(dir.multiplyScalar(lift))
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
    return curve.getPoints(24)
  }, [from, to])

  return (
    <Line
      points={points}
      color={active ? '#00D9B5' : '#3A4A6B'}
      lineWidth={active ? 1.6 : 0.7}
      transparent
      opacity={active ? Math.min(1, opacity + 0.25) : opacity * 0.5}
      dashed={false}
    />
  )
}
