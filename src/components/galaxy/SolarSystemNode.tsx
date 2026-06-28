import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SIMPLEX_3D, FBM, FRESNEL } from '@/lib/three/shaderChunks'

interface SolarSystemMeshProps {
  color: string
  size: number
  emphasis: number
}

/**
 * Photosphere shader: a turbulent granulation surface built from animated fbm
 * noise that roils over time, blending from a hot white-gold core toward the
 * node `color` at the limb, with a Fresnel chromosphere rim that glows hotter
 * at the edges. Driven by `uTime` (advanced in useFrame) and `uEmphasis`.
 */
const STAR_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vObjPos;
  void main() {
    vObjPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const STAR_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uEmphasis;
  uniform vec3 uCoreColor;
  uniform vec3 uLimbColor;
  uniform vec3 uCameraPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vObjPos;

  ${SIMPLEX_3D}
  ${FBM}
  ${FRESNEL}

  void main() {
    // Domain-warped fbm for roiling convective granulation cells.
    vec3 sp = normalize(vObjPos);
    float t = uTime * 0.18;
    vec3 q = sp * 2.4;
    // warp the sampling space so cells churn rather than just slide
    vec3 warp = vec3(
      fbm(q + vec3(0.0, 0.0, t), 4),
      fbm(q + vec3(5.2, 1.3, t * 0.8), 4),
      fbm(q + vec3(1.7, 9.2, t * 1.2), 4)
    );
    float granules = fbm(q * 1.6 + warp * 1.4 + vec3(0.0, 0.0, t * 1.5), 6);
    granules = granules * 0.5 + 0.5;

    // Fine high-frequency sizzle on top of the big cells.
    float sizzle = fbm(sp * 9.0 + warp * 2.0 + vec3(t * 2.0), 4) * 0.5 + 0.5;
    float surface = mix(granules, sizzle, 0.25);

    // Sharpen into bright cell cores vs. darker intergranular lanes.
    float cells = smoothstep(0.30, 0.85, surface);

    // Slow prominence / flare flicker pulse.
    float flare = 0.5 + 0.5 * sin(uTime * 1.3 + granules * 6.2831);
    flare = pow(flare, 3.0);

    // Limb darkening + Fresnel chromosphere rim.
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float ndv = clamp(dot(normalize(vWorldNormal), viewDir), 0.0, 1.0);
    float limbDark = mix(0.55, 1.0, pow(ndv, 0.5));
    float rim = fresnel(vWorldNormal, viewDir, 2.6);

    // Color: hot core where cells are bright, cooler node-tinted lanes.
    vec3 col = mix(uLimbColor, uCoreColor, cells);
    col += uCoreColor * flare * 0.18 * (0.4 + cells);
    col *= limbDark;

    // Chromosphere: push the rim toward the saturated node color and bloom it.
    col = mix(col, uLimbColor * 1.6, rim * 0.85);

    float brightness = 1.25 + uEmphasis * 1.1 + cells * 0.6 + rim * 0.9;
    col *= brightness;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const CORONA_VERT = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const CORONA_FRAG = /* glsl */ `
  precision highp float;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec3 uCameraPos;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;

  ${FRESNEL}

  void main() {
    // Backside spheres: glow concentrated near the silhouette edge.
    vec3 viewDir = normalize(uCameraPos - vWorldPos);
    float rim = fresnel(vWorldNormal, viewDir, 3.0);
    float glow = pow(rim, 1.4) * uIntensity;
    gl_FragColor = vec4(uColor * glow, glow);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const RING_VERT = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  varying float vBand;   // 0 at inner edge, 1 at outer edge
  varying float vAngle;  // [0,1) around the ring
  void main() {
    float r = length(position.xy);
    vBand = clamp((r - uInner) / max(uOuter - uInner, 1e-4), 0.0, 1.0);
    vAngle = atan(position.y, position.x) / 6.2831853 + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const RING_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying float vBand;
  varying float vAngle;

  void main() {
    // soft gradient on both inner and outer edges of the band
    float band = smoothstep(0.0, 0.5, vBand) * smoothstep(1.0, 0.5, vBand);
    // angular shimmer travelling around the ring
    float ang = vAngle * 6.2831853;
    float shimmer = 0.7 + 0.3 * sin(ang * 9.0 - uTime * 2.0);
    float a = band * shimmer * uIntensity;
    gl_FragColor = vec4(uColor * a * 1.4, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function SolarSystemNode({ color, size, emphasis }: SolarSystemMeshProps) {
  const ring = useRef<THREE.Mesh>(null)
  const flares = useRef<THREE.Group>(null)

  // Build all uniforms / colors once. Mutate in place during useFrame.
  const { starUniforms, coronaLayers, ringUniforms } = useMemo(() => {
    const base = new THREE.Color(color)
    // A hot white-gold core nudged toward the node hue keeps it from going pure white.
    const core = base.clone().lerp(new THREE.Color('#fff6e6'), 0.7)

    const starUniforms = {
      uTime: { value: 0 },
      uEmphasis: { value: emphasis },
      uCoreColor: { value: core },
      uLimbColor: { value: base.clone() },
      uCameraPos: { value: new THREE.Vector3() },
    }

    // 3 stacked additive backside shells, growing scale + falling opacity.
    const coronaLayers = [
      { scale: 1.18, intensity: 0.9 },
      { scale: 1.55, intensity: 0.45 },
      { scale: 2.2, intensity: 0.22 },
    ].map((layer) => ({
      ...layer,
      uniforms: {
        uIntensity: { value: layer.intensity },
        uColor: { value: base.clone() },
        uCameraPos: { value: starUniforms.uCameraPos.value },
      },
    }))

    const ringUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uColor: { value: base.clone().lerp(new THREE.Color('#ffffff'), 0.25) },
      uInner: { value: size * 1.7 },
      uOuter: { value: size * 2.35 },
    }

    return { starUniforms, coronaLayers, ringUniforms }
  }, [color, emphasis, size])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    starUniforms.uTime.value = t
    starUniforms.uEmphasis.value = emphasis
    // Shared camera position vector (referenced by every corona layer too).
    starUniforms.uCameraPos.value.copy(state.camera.position)

    ringUniforms.uTime.value = t
    ringUniforms.uIntensity.value = 0.45 + emphasis * 0.4

    if (ring.current) ring.current.rotation.z += delta * 0.25
    if (flares.current) flares.current.rotation.y += delta * 0.06
  })

  return (
    <group ref={flares}>
      {/* Photosphere */}
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <shaderMaterial
          vertexShader={STAR_VERT}
          fragmentShader={STAR_FRAG}
          uniforms={starUniforms}
          toneMapped={false}
        />
      </mesh>

      {/* Volumetric corona shells (additive, backside) */}
      {coronaLayers.map((layer, i) => (
        <mesh key={i} scale={layer.scale}>
          <sphereGeometry args={[size, 32, 32]} />
          <shaderMaterial
            vertexShader={CORONA_VERT}
            fragmentShader={CORONA_FRAG}
            uniforms={layer.uniforms}
            transparent
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Accretion / corona ring, tilted in 3D */}
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.35, 0]}>
        <ringGeometry args={[size * 1.7, size * 2.35, 96, 1]} />
        <shaderMaterial
          vertexShader={RING_VERT}
          fragmentShader={RING_FRAG}
          uniforms={ringUniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
