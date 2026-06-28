import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SIMPLEX_3D, FBM } from '@/lib/three/shaderChunks'

interface NebulaFieldProps {
  count?: number
  radius?: number
}

/**
 * Volumetric-feeling nebula.
 *
 * Thousands of additive, soft round gas puffs (gl_PointCoord radial falloff) of
 * widely varying size — from large diffuse clouds to fine dust. Placement is
 * biased by 3D noise into a few denser clumps so the silhouette reads as a real
 * nebula rather than an even ring. Deep-violet cores blend out to teal and gold
 * highlights, and a `uTime`-driven fbm gently billows brightness and nudges each
 * puff so the whole cloud feels alive on top of a slow overall rotation.
 *
 * Positions/colours/sizes are computed once in useMemo; only uniforms animate.
 */

const NEBULA_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aSeed;     // per-puff random phase
  attribute float aDensity;  // 0..1 placement density (drives opacity/colour)

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  ${SIMPLEX_3D}
  ${FBM}

  void main() {
    vColor = color;
    vSeed = aSeed;

    // Slow billowing displacement so clumps churn internally.
    vec3 p = position;
    float t = uTime * 0.06;
    vec3 q = p * 0.012 + vec3(aSeed * 10.0);
    float nx = fbm(q + vec3(t, 0.0, 0.0), 3);
    float ny = fbm(q + vec3(0.0, t, 5.0), 3);
    float nz = fbm(q + vec3(7.0, 0.0, t), 3);
    p += vec3(nx, ny, nz) * 4.0;

    // Breathing opacity from a second, slower noise field.
    float breathe = 0.6 + 0.4 * fbm(q * 0.5 + vec3(t * 0.5), 2);
    vAlpha = aDensity * breathe;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uPixelRatio * (340.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const NEBULA_FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Soft round gas puff with a gentle inner hot spot.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float falloff = smoothstep(0.5, 0.0, d);
    float soft = pow(falloff, 2.2);

    // Keep each puff faint; many overlapping puffs build up density.
    float alpha = soft * vAlpha * 0.16;
    vec3 col = vColor * (0.7 + 0.5 * soft);
    gl_FragColor = vec4(col, alpha);
  }
`

// CPU-side value noise so density clumping is consistent without a GPU readback.
function hash3(x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const c000 = hash3(xi, yi, zi)
  const c100 = hash3(xi + 1, yi, zi)
  const c010 = hash3(xi, yi + 1, zi)
  const c110 = hash3(xi + 1, yi + 1, zi)
  const c001 = hash3(xi, yi, zi + 1)
  const c101 = hash3(xi + 1, yi, zi + 1)
  const c011 = hash3(xi, yi + 1, zi + 1)
  const c111 = hash3(xi + 1, yi + 1, zi + 1)

  const x00 = lerp(c000, c100, u)
  const x10 = lerp(c010, c110, u)
  const x01 = lerp(c001, c101, u)
  const x11 = lerp(c011, c111, u)
  const y0 = lerp(x00, x10, v)
  const y1 = lerp(x01, x11, v)
  return lerp(y0, y1, w)
}

export function NebulaField({ count = 3200, radius = 110 }: NebulaFieldProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const pointsRef = useRef<THREE.Points>(null)

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count)
    const densities = new Float32Array(count)

    const violet = new THREE.Color('#5B3F8F')
    const deepViolet = new THREE.Color('#2a1d52')
    const teal = new THREE.Color('#00D9B5')
    const gold = new THREE.Color('#D4A843')
    const c = new THREE.Color()

    let written = 0
    let guard = 0
    const maxTries = count * 12

    while (written < count && guard < maxTries) {
      guard++
      // Sample a flattened ellipsoid (disc-like with vertical thickness).
      const r = Math.pow(Math.random(), 0.5) * radius
      const theta = Math.random() * Math.PI * 2
      const x = Math.cos(theta) * r
      const z = Math.sin(theta) * r
      const y = (Math.random() - 0.5) * radius * 0.45

      // Density field: clump via low-frequency noise so it is not a uniform ring.
      const n =
        0.6 * valueNoise(x * 0.025, y * 0.05, z * 0.025) +
        0.4 * valueNoise(x * 0.07 + 19.3, y * 0.09, z * 0.07 + 7.1)
      // Rejection sampling biased toward dense clumps.
      if (Math.random() > Math.pow(n, 1.6)) continue

      const i = written++
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Colour: deep-violet cores in dense regions, teal mids, gold highlights.
      const edge = r / radius
      if (n > 0.62) {
        c.copy(deepViolet).lerp(violet, (n - 0.62) / 0.38)
      } else {
        c.copy(violet).lerp(teal, Math.min(1, edge * 1.2))
      }
      // Sparse warm gold flecks for highlight contrast.
      if (Math.random() < 0.06) c.lerp(gold, 0.5 + Math.random() * 0.3)

      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b

      // Size: big soft clouds in dense cores, fine dust elsewhere.
      const big = Math.random() < 0.18
      sizes[i] = big
        ? 26 + Math.random() * 40 * n
        : 4 + Math.pow(Math.random(), 2) * 14

      seeds[i] = Math.random()
      densities[i] = 0.4 + n * 0.9
    }

    return { positions, colors, sizes, seeds, densities, used: written }
  }, [count, radius])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008
    }
  })

  // Slice to the actually-written length so no empty (0,0,0) puffs render.
  const n = data.used
  const positions = useMemo(() => data.positions.subarray(0, n * 3), [data, n])
  const colors = useMemo(() => data.colors.subarray(0, n * 3), [data, n])
  const sizes = useMemo(() => data.sizes.subarray(0, n), [data, n])
  const seeds = useMemo(() => data.seeds.subarray(0, n), [data, n])
  const densities = useMemo(() => data.densities.subarray(0, n), [data, n])

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aDensity" args={[densities, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
