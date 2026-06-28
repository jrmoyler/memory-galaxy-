import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useGalaxyStore } from '@/store/useGalaxyStore'

/** Minimal shape of the drei/three OrbitControls instance we drive. */
interface OrbitControlsImpl {
  target: THREE.Vector3
  update: () => void
}

/**
 * Owns OrbitControls and performs smooth "zoom-to-object" flights when the
 * store emits a focus request. We lerp both the camera position and the
 * controls target toward goals derived from the focused node, then hand control
 * back to the user once the flight settles.
 */
export function CameraRig() {
  const controls = useRef<OrbitControlsImpl | null>(null)
  const { camera } = useThree()

  const focus = useGalaxyStore((s) => s.focus)
  const nodes = useGalaxyStore((s) => s.graph.nodes)

  const animating = useRef(false)
  const goalTarget = useRef(new THREE.Vector3())
  const goalPos = useRef(new THREE.Vector3())

  useEffect(() => {
    if (focus.nodeId === null) {
      // Reset request → fly back to the default overview.
      goalTarget.current.set(0, 0, 0)
      goalPos.current.set(0, 28, 70)
      animating.current = true
      return
    }
    const node = nodes.find((n) => n.id === focus.nodeId)
    if (!node) return
    const target = new THREE.Vector3(node.position.x, node.position.y, node.position.z)
    goalTarget.current.copy(target)
    // Position the camera a comfortable distance back along a pleasant angle,
    // scaled by node size so big galaxies get more room.
    const dist = 6 + node.size * 5
    const offset = new THREE.Vector3(dist * 0.6, dist * 0.45, dist)
    goalPos.current.copy(target).add(offset)
    animating.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus.nonce])

  useFrame(() => {
    if (!animating.current || !controls.current) return
    const ctrl = controls.current
    camera.position.lerp(goalPos.current, 0.08)
    ctrl.target.lerp(goalTarget.current, 0.08)
    ctrl.update()
    // Stop once we're close enough.
    if (
      camera.position.distanceTo(goalPos.current) < 0.5 &&
      ctrl.target.distanceTo(goalTarget.current) < 0.5
    ) {
      animating.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls as never}
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={160}
      // Stop the user fighting an in-progress flight feels bad; allow it but
      // the lerp simply resumes toward goal next frame if still animating.
      makeDefault
    />
  )
}
