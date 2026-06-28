import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Cinematic multi-layer star sky.
 *
 * Each layer is a custom `<points>` cloud rendered with a `<shaderMaterial>` that:
 *  - draws soft, round star sprites via gl_PointCoord radial falloff
 *  - twinkles each star independently using a per-star phase + uTime
 *  - varies size and colour (cool blue-white, warm gold, faint teal) per star
 *  - additively blends with depthWrite off so it glows into the bloom pass
 *
 * Three depth shells parallax-rotate at slightly different speeds for real depth,
 * and a sparse set of brighter "hero" stars anchors the eye.
 */

const STAR_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;

  attribute float aSize;
  attribute float aPhase;     // 0..1, randomises twinkle timing
  attribute float aTwinkle;   // 0..1, how strongly this star twinkles

  varying vec3 vColor;
  varying float vBright;

  void main() {
    vColor = color;

    // Independent twinkle: blend of two detuned sines so it never looks periodic.
    float t = uTime + aPhase * 6.2831853;
    float flicker = 0.5 + 0.5 * (0.6 * sin(t * 2.3) + 0.4 * sin(t * 5.1 + 1.7));
    vBright = mix(1.0, flicker, aTwinkle);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Size attenuation + a subtle pulse on the radius so big stars breathe.
    float size = aSize * uSizeScale * (0.85 + 0.15 * vBright);
    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const STAR_FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying float vBright;

  void main() {
    // Round, soft-edged sprite from the point's local coords.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    // Soft core + faint halo for a glowing twinkle.
    float core = smoothstep(0.5, 0.0, d);
    float halo = pow(core, 2.5);
    float alpha = (halo * 0.85 + core * 0.15) * vBright;

    vec3 col = vColor * (0.6 + 0.8 * vBright);
    gl_FragColor = vec4(col, alpha);
  }
`

interface LayerConfig {
  count: number
  innerRadius: number
  outerRadius: number
  baseSize: number
  rotationSpeed: number
  twinkleAmount: number
  /** Fraction (0..1) of stars in this layer that are brighter "hero" stars. */
  heroFraction: number
}

const PALETTE = {
  blueWhite: new THREE.Color('#cfe4ff'),
  white: new THREE.Color('#ffffff'),
  gold: new THREE.Color('#ffd9a0'),
  teal: new THREE.Color('#7cf0dc'),
  violet: new THREE.Color('#b9a3e8'),
}

function buildLayer(cfg: LayerConfig) {
  const { count, innerRadius, outerRadius, heroFraction } = cfg
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const twinkles = new Float32Array(count)

  const c = new THREE.Color()

  for (let i = 0; i < count; i++) {
    // Distribute on a spherical shell (uniform over the sphere surface).
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = innerRadius + Math.random() * (outerRadius - innerRadius)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi) * 0.7 // slight vertical squash
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    // Colour: mostly cool blue-white, with warm gold and faint teal/violet accents.
    const pick = Math.random()
    if (pick < 0.6) {
      c.copy(PALETTE.white).lerp(PALETTE.blueWhite, Math.random())
    } else if (pick < 0.82) {
      c.copy(PALETTE.gold).lerp(PALETTE.white, Math.random() * 0.4)
    } else if (pick < 0.94) {
      c.copy(PALETTE.teal).lerp(PALETTE.white, Math.random() * 0.5)
    } else {
      c.copy(PALETTE.violet).lerp(PALETTE.blueWhite, Math.random() * 0.5)
    }

    const isHero = Math.random() < heroFraction
    // Size: power curve keeps most stars small with a long tail of bigger ones.
    let size = cfg.baseSize * (0.4 + Math.pow(Math.random(), 2.5) * 1.8)
    if (isHero) {
      size *= 2.6 + Math.random() * 1.6
      c.lerp(PALETTE.white, 0.4) // hero stars burn whiter/hotter
    }

    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
    sizes[i] = size
    phases[i] = Math.random()
    // Heroes twinkle gently; fine background dust twinkles more.
    twinkles[i] = isHero ? 0.25 + Math.random() * 0.2 : 0.5 + Math.random() * 0.5
  }

  return { positions, colors, sizes, phases, twinkles }
}

const LAYERS: LayerConfig[] = [
  // Near, sparse, large parallax — fastest.
  {
    count: 700,
    innerRadius: 90,
    outerRadius: 150,
    baseSize: 2.6,
    rotationSpeed: 0.012,
    twinkleAmount: 1,
    heroFraction: 0.05,
  },
  // Mid field — the main body of the sky.
  {
    count: 1600,
    innerRadius: 150,
    outerRadius: 230,
    baseSize: 1.9,
    rotationSpeed: 0.007,
    twinkleAmount: 1,
    heroFraction: 0.02,
  },
  // Far, dense, fine dust — slowest.
  {
    count: 2400,
    innerRadius: 230,
    outerRadius: 330,
    baseSize: 1.4,
    rotationSpeed: 0.003,
    twinkleAmount: 1,
    heroFraction: 0.008,
  },
]

interface StarLayerProps {
  config: LayerConfig
}

function StarLayer({ config }: StarLayerProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)

  const data = useMemo(() => buildLayer(config), [config])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: {
        value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      },
      uSizeScale: { value: 1 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * config.rotationSpeed
      groupRef.current.rotation.x += delta * config.rotationSpeed * 0.15
    }
  })

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[data.sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[data.phases, 1]} />
          <bufferAttribute attach="attributes-aTwinkle" args={[data.twinkles, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

export function StarField() {
  return (
    <>
      {LAYERS.map((config, i) => (
        <StarLayer key={i} config={config} />
      ))}
    </>
  )
}
