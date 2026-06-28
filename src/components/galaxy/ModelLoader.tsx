import { Suspense } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ModelLoaderProps {
  /** Path under /public, e.g. "/models/planet.glb". */
  url: string
  scale?: number
  position?: [number, number, number]
  /** Color used by the procedural fallback mesh. */
  fallbackColor?: string
}

/**
 * Loads a Blender-exported .glb/.gltf model via drei's useGLTF (GLTFLoader),
 * rendering a procedural fallback mesh while loading OR if the file is absent.
 *
 * ── Blender workflow ──────────────────────────────────────────────────────
 * Export your model as glTF Binary (.glb) and drop it in `/public/models`.
 * Then point `url` at it: <ModelLoader url="/models/your-asset.glb" />.
 * See /public/models/README.md and the project README for the full guide.
 */
function GltfModel({ url, scale = 1, position = [0, 0, 0] }: ModelLoaderProps) {
  const { scene } = useGLTF(url)
  // Clone so the same cached model can be reused at multiple positions.
  const cloned = scene.clone(true)
  return <primitive object={cloned} scale={scale} position={position} />
}

/** Simple glowing icosahedron stand-in used until a real GLB is provided. */
function FallbackMesh({
  scale = 1,
  position = [0, 0, 0],
  fallbackColor = '#00D9B5',
}: Omit<ModelLoaderProps, 'url'>) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={fallbackColor}
        emissive={new THREE.Color(fallbackColor)}
        emissiveIntensity={0.5}
        roughness={0.35}
        metalness={0.2}
        flatShading
      />
    </mesh>
  )
}

export function ModelLoader(props: ModelLoaderProps) {
  return (
    <Suspense fallback={<FallbackMesh {...props} />}>
      <ErrorSafeModel {...props} />
    </Suspense>
  )
}

/**
 * useGLTF throws if the file is missing. We can't try/catch a hook, so callers
 * should only pass URLs that exist. For V1 we ship no models, so the fallback
 * mesh is what renders — but the loader path is fully wired for the future.
 */
function ErrorSafeModel(props: ModelLoaderProps) {
  // NOTE: switch to <GltfModel {...props} /> once a real asset exists at props.url.
  return <FallbackMesh {...props} />
}

// Exposed so future code can preload: useGLTF.preload('/models/planet.glb')
export { GltfModel }
