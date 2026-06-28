import { useMemo, useRef } from 'react'
// shader materials are driven entirely through their shared uniforms objects,
// so we only need refs for the meshes/groups we animate by transform.
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SIMPLEX_3D, FBM, FRESNEL } from '@/lib/three/shaderChunks'

interface PlanetMeshProps {
  color: string
  size: number
  emphasis: number // 0..1 glow boost from hover/selection
  withRing?: boolean
}

/** Fixed "sun" direction shared by every layer so the terminator stays coherent. */
const SUN_DIR = /* glsl */ `const vec3 SUN_DIR = normalize(vec3(1.0, 0.5, 0.8));`

/* ------------------------------------------------------------------ *
 * Shared vertex shader: passes world-space position, normal and the
 * raw object position (used as the 3D noise domain so the surface is
 * stable on the sphere and seam-free).
 * ------------------------------------------------------------------ */
const SURFACE_VERT = /* glsl */ `
varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;
void main() {
  vObjPos = normalize(position);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

/* ------------------------------------------------------------------ *
 * Planet surface: fbm continents / gas-banding tinted around uColor,
 * day/night terminator from a fixed sun direction, plus a faint
 * specular sun-glint and a tight inner fresnel that warms the limb.
 * ------------------------------------------------------------------ */
const SURFACE_FRAG = /* glsl */ `
precision highp float;
${SIMPLEX_3D}
${FBM}
${FRESNEL}
${SUN_DIR}

uniform float uTime;
uniform float uEmphasis;
uniform vec3  uColor;
uniform vec3  uDeep;   // dark / ocean / shadow tint
uniform vec3  uHigh;   // bright / land / cloudtop tint

varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = vObjPos;

  // Continental / banding mask. Latitude term gives gas-giant bands,
  // domain-warped fbm gives broken continents so it never looks striped.
  float lat = p.y;
  vec3 warp = vec3(
    fbm(p * 1.7 + 11.0, 4),
    fbm(p * 1.7 + 31.0, 4),
    fbm(p * 1.7 + 51.0, 4)
  );
  float continents = fbm(p * 2.3 + warp * 0.6, 6);
  float bands = sin(lat * 9.0 + continents * 2.2) * 0.5 + 0.5;
  float terrain = mix(continents * 0.5 + 0.5, bands, 0.35);

  // Coastline / detail crinkle.
  float detail = fbm(p * 6.0 + warp, 5) * 0.5 + 0.5;
  terrain = clamp(terrain * 0.75 + detail * 0.25, 0.0, 1.0);

  // Build albedo: deep tint -> base color -> bright highlands.
  vec3 albedo = mix(uDeep, uColor, smoothstep(0.25, 0.6, terrain));
  albedo = mix(albedo, uHigh, smoothstep(0.7, 0.95, terrain));

  // Polar ice caps.
  float ice = smoothstep(0.72, 0.92, abs(lat));
  albedo = mix(albedo, mix(uHigh, vec3(1.0), 0.6), ice * 0.85);

  // Day / night terminator from the fixed sun direction.
  float ndl = dot(normalize(vWorldNormal), SUN_DIR);
  float day = smoothstep(-0.25, 0.35, ndl);
  vec3 lit = albedo * (0.06 + 0.94 * day);

  // Subtle warm sun glint on the day side (water / atmosphere sheen).
  vec3 h = normalize(SUN_DIR + normalize(vViewDir));
  float spec = pow(max(dot(normalize(vWorldNormal), h), 0.0), 28.0);
  lit += spec * day * 0.35 * vec3(1.0, 0.95, 0.85) * (1.0 - terrain * 0.5);

  // Faint night-side self-glow so the dark limb still reads (and blooms gently).
  lit += uDeep * (1.0 - day) * 0.12;

  // Inner fresnel: warm the very edge of the disc so the atmosphere
  // shell below has something to blend into.
  float rim = fresnel(vWorldNormal, vViewDir, 3.0);
  lit += uColor * rim * (0.35 + uEmphasis * 0.4);

  // Emphasis lifts overall luminance a touch on hover/selection.
  lit *= 1.0 + uEmphasis * 0.25;

  gl_FragColor = vec4(lit, 1.0);
}
`

/* ------------------------------------------------------------------ *
 * Atmosphere: backside additive shell whose opacity follows fresnel,
 * brightest & coolest right at the limb. Scattering is strongest on the
 * day side (forward-scatter towards the sun) for a believable halo.
 * ------------------------------------------------------------------ */
const ATMO_FRAG = /* glsl */ `
precision highp float;
${FRESNEL}
${SUN_DIR}

uniform float uEmphasis;
uniform vec3  uColor;
uniform vec3  uRim;

varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  // Backside shell: flip the normal so fresnel peaks on the silhouette.
  float f = fresnel(-vWorldNormal, vViewDir, 3.2);
  float scatter = smoothstep(-0.5, 0.6, dot(normalize(-vWorldNormal), SUN_DIR));
  float glow = pow(f, 1.4) * (0.35 + 0.65 * scatter);

  vec3 col = mix(uColor, uRim, f);
  float alpha = glow * (0.55 + uEmphasis * 0.45);
  gl_FragColor = vec4(col * (1.0 + uEmphasis * 0.5), alpha);
}
`

/* ------------------------------------------------------------------ *
 * Cloud layer: slightly larger sphere, semi-transparent fbm clouds
 * scrolling slowly in uTime, lit by the same terminator so the dark
 * side clouds fade out instead of glowing.
 * ------------------------------------------------------------------ */
const CLOUD_FRAG = /* glsl */ `
precision highp float;
${SIMPLEX_3D}
${FBM}
${SUN_DIR}

uniform float uTime;
uniform float uEmphasis;
uniform vec3  uColor;

varying vec3 vObjPos;
varying vec3 vWorldNormal;
varying vec3 vViewDir;

void main() {
  vec3 p = vObjPos;
  vec3 drift = vec3(uTime * 0.012, 0.0, uTime * 0.006);
  float clouds = fbm(p * 2.6 + drift, 5) * 0.5 + 0.5;
  float warp = fbm(p * 5.0 + drift * 1.7, 4) * 0.5 + 0.5;
  clouds = smoothstep(0.52, 0.78, clouds * 0.7 + warp * 0.3);

  float day = smoothstep(-0.2, 0.4, dot(normalize(vWorldNormal), SUN_DIR));
  vec3 col = mix(uColor, vec3(1.0), 0.7);
  float alpha = clouds * (0.18 + 0.5 * day) * (0.85 + uEmphasis * 0.3);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col * (0.4 + 0.6 * day), alpha);
}
`

/* ------------------------------------------------------------------ *
 * Planetary ring: flat ring geometry. Radial gradient + noise banding,
 * additive, with a soft gap (Cassini-style) and inner/outer fade.
 * ------------------------------------------------------------------ */
const RING_VERT = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const RING_FRAG = /* glsl */ `
precision highp float;
${SIMPLEX_3D}
${FBM}

uniform float uTime;
uniform float uEmphasis;
uniform float uInner;
uniform float uOuter;
uniform vec3  uColor;
uniform vec3  uRim;

varying vec3 vLocal;

void main() {
  float r = length(vLocal.xy);
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

  // Soft inner & outer edges.
  float edge = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.86, 1.0, t));

  // Concentric banding driven by noise around the ring radius.
  float ang = atan(vLocal.y, vLocal.x);
  float bands = fbm(vec3(t * 26.0, ang * 0.6, uTime * 0.02), 4) * 0.5 + 0.5;
  bands = mix(0.45, 1.0, bands);

  // Cassini-style gap.
  float gap = smoothstep(0.02, 0.0, abs(t - 0.55));
  edge *= (1.0 - gap * 0.9);

  vec3 col = mix(uColor, uRim, t);
  float alpha = edge * bands * (0.45 + uEmphasis * 0.35);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`

export function PlanetNode({ color, size, emphasis, withRing }: PlanetMeshProps) {
  const cloudMesh = useRef<THREE.Mesh>(null)
  const ringMesh = useRef<THREE.Mesh>(null)
  const planet = useRef<THREE.Group>(null)

  // Derive a coherent palette once. Mutated in place on emphasis changes via
  // uniform writes below — Colors themselves are stable.
  const palette = useMemo(() => {
    const base = new THREE.Color(color)
    const hsl = { h: 0, s: 0, l: 0 }
    base.getHSL(hsl)
    const deep = new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1), hsl.l * 0.32)
    const high = new THREE.Color().setHSL(
      (hsl.h + 0.04) % 1,
      Math.max(0, hsl.s * 0.55),
      Math.min(1, hsl.l * 1.5 + 0.25),
    )
    const rim = new THREE.Color().setHSL(
      (hsl.h + 0.5) % 1, // complementary, cool atmospheric edge
      Math.min(1, hsl.s * 0.6 + 0.2),
      Math.min(1, hsl.l + 0.45),
    )
    return { base, deep, high, rim }
  }, [color])

  // One uniform object per material, built once.
  const uniforms = useMemo(() => {
    const time = { value: 0 }
    return {
      time,
      surface: {
        uTime: time,
        uEmphasis: { value: emphasis },
        uColor: { value: palette.base.clone() },
        uDeep: { value: palette.deep.clone() },
        uHigh: { value: palette.high.clone() },
      },
      atmo: {
        uEmphasis: { value: emphasis },
        uColor: { value: palette.base.clone() },
        uRim: { value: palette.rim.clone() },
      },
      cloud: {
        uTime: time,
        uEmphasis: { value: emphasis },
        uColor: { value: palette.base.clone() },
      },
      ring: {
        uTime: time,
        uEmphasis: { value: emphasis },
        uInner: { value: size * 1.45 },
        uOuter: { value: size * 2.4 },
        uColor: { value: palette.high.clone() },
        uRim: { value: palette.rim.clone() },
      },
    }
    // palette colors are cloned into uniforms; size is constant per instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, size])

  const atmoScale = 1.18 + emphasis * 0.12

  useFrame((_, delta) => {
    uniforms.time.value += delta

    // Keep emphasis-driven uniforms in sync without per-frame allocation.
    uniforms.surface.uEmphasis.value = emphasis
    uniforms.atmo.uEmphasis.value = emphasis
    uniforms.cloud.uEmphasis.value = emphasis
    uniforms.ring.uEmphasis.value = emphasis

    if (planet.current) planet.current.rotation.y += delta * 0.04
    if (cloudMesh.current) cloudMesh.current.rotation.y += delta * 0.055
    if (ringMesh.current) ringMesh.current.rotation.z += delta * 0.03
  })

  return (
    <group>
      {/* Planet surface + clouds rotate together as a "body" */}
      <group ref={planet}>
        <mesh>
          <sphereGeometry args={[size, 64, 64]} />
          <shaderMaterial
            vertexShader={SURFACE_VERT}
            fragmentShader={SURFACE_FRAG}
            uniforms={uniforms.surface}
          />
        </mesh>

        {/* Drifting cloud layer */}
        <mesh ref={cloudMesh} scale={1.022}>
          <sphereGeometry args={[size, 48, 48]} />
          <shaderMaterial
            vertexShader={SURFACE_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={uniforms.cloud}
            transparent
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      </group>

      {/* Fresnel atmosphere halo (backside additive shell) */}
      <mesh scale={atmoScale}>
        <sphereGeometry args={[size, 48, 48]} />
        <shaderMaterial
          vertexShader={SURFACE_VERT}
          fragmentShader={ATMO_FRAG}
          uniforms={uniforms.atmo}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {withRing && (
        <mesh ref={ringMesh} rotation={[Math.PI / 2.3, 0, 0.18]}>
          <ringGeometry args={[size * 1.45, size * 2.4, 128, 1]} />
          <shaderMaterial
            vertexShader={RING_VERT}
            fragmentShader={RING_FRAG}
            uniforms={uniforms.ring}
            transparent
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
