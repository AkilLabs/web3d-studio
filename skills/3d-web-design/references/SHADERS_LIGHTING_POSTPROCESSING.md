# Shaders, Studio Lighting & Post-Processing Reference

Deep-dive patterns for crafting physically based materials, studio lighting setups, custom GLSL shaders, and high-performance post-processing in Three.js and React Three Fiber.

## 1. Studio Three-Point Lighting + Custom Environment Rig

Instead of relying on external `.hdr` files that can fail to load or stall network requests, build procedural HDR studio environment maps using `@react-three/drei`'s `<Environment>` and `<Lightformer>`:

```tsx
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';

export function StudioLightingRig() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[5, 8, 5]}
        intensity={2.0}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-5, 3, -4]} intensity={0.7} color="#93c5fd" />

      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          {/* Overhead softbox key strip */}
          <Lightformer form="rect" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          {/* Warm left fill accent */}
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} color="#fde68a" />
          {/* Cool right rim highlight */}
          <Lightformer form="ring" color="#60a5fa" intensity={3} onUpdate={(self) => self.lookAt(0, 0, 0)} position={[10, 1, 0]} scale={8} />
        </group>
      </Environment>

      <ContactShadows position={[0, -1.2, 0]} opacity={0.45} scale={12} blur={2.2} far={4} />
    </>
  );
}
```

## 2. High-Craft PBR Material Recipes

Use these verified material parameter sets instead of raw default materials:

| Material Archetype | Component | Key Properties |
| --- | --- | --- |
| Anodized Aluminum (Apple Space Gray / Silver) | `meshStandardMaterial` | `color="#d4d4d8"`, `metalness={0.88}`, `roughness={0.22}`, `envMapIntensity={1.2}` |
| Brushed Titanium | `meshPhysicalMaterial` | `color="#a1a1aa"`, `metalness={0.92}`, `roughness={0.28}`, `clearcoat={0.15}`, `clearcoatRoughness={0.3}` |
| Refractive Optical Glass | `meshPhysicalMaterial` | `transmission={0.96}`, `opacity={1}`, `transparent`, `roughness={0.08}`, `ior={1.52}`, `thickness={1.4}`, `chromaticAberration={0.03}` |
| Ceramic / Matte Coat | `meshPhysicalMaterial` | `color="#f8fafc"`, `metalness={0.05}`, `roughness={0.35}`, `clearcoat={0.85}`, `clearcoatRoughness={0.12}` |
| Emissive Neon / Energy Core | `meshBasicMaterial` | `color={[2.5, 0.8, 4.0]}`, `toneMapped={false}` (pairs with selective `<Bloom>`) |

## 3. Custom GLSL Shaders via `shaderMaterial`

When building custom procedural surfaces (liquid waves, holographic grids, Fresnel rim glow, or vertex displacement), register a reusable typed shader material with `@react-three/drei`'s `shaderMaterial` and animate `uTime` inside `useFrame`:

```tsx
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame } from '@react-three/fiber';
import { useRef } from 'react';

const FresnelGlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uBaseColor: new THREE.Color('#0f172a'),
    uRimColor: new THREE.Color('#38bdf8'),
    uRimPower: 2.8,
  },
  // Vertex Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform float uTime;

    void main() {
      vec3 displaced = position + normal * sin(position.y * 4.0 + uTime * 2.0) * 0.03;
      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform vec3 uBaseColor;
    uniform vec3 uRimColor;
    uniform float uRimPower;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), uRimPower);
      vec3 finalColor = mix(uBaseColor, uRimColor * 1.8, fresnel);
      gl_FragColor = vec4(finalColor, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ FresnelGlowMaterial });

export function HolographicOrb() {
  const matRef = useRef<any>(null!);
  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uTime += delta;
  });

  return (
    <mesh>
      <sphereGeometry args={[1.2, 64, 64]} />
      {/* @ts-expect-error custom extended material */}
      <fresnelGlowMaterial ref={matRef} />
    </mesh>
  );
}
```

## 4. Post-Processing Pipeline Restraint

Post-processing passes run fragment shaders across every pixel on screen. Follow these rules to keep frame times under 8ms:

- Disable default MSAA on `<Canvas gl={{ antialias: false }}>` when using `<EffectComposer multisampling={4}>` so you do not pay for antialiasing twice.
- Limit active effects to at most 2-3 merged passes (for example, `Bloom` + subtle `Vignette`). Avoid stacking `SSAO` + `DepthOfField` + `SSR` on mobile devices; gate heavy passes behind `@react-three/drei`'s `<PerformanceMonitor onDecline={() => setDegraded(true)} />`.
