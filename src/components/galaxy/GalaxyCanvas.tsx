import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { GalaxyScene } from './GalaxyScene'
import { useGalaxyStore } from '@/store/useGalaxyStore'

/**
 * Full-screen R3F canvas hosting the galaxy. Clicking empty space clears the
 * current selection. Wrapped in Suspense so async assets (future GLB models)
 * never blank the screen — a CSS starfield backdrop shows through meanwhile.
 */
export function GalaxyCanvas() {
  const selectNode = useGalaxyStore((s) => s.selectNode)

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 28, 70], fov: 55, near: 0.1, far: 600 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => selectNode(null)}
      >
        <color attach="background" args={['#050A18']} />
        <fog attach="fog" args={['#050A18', 90, 280]} />
        <Suspense fallback={null}>
          <GalaxyScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
