'use client';

import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ScrollControls,
  Scroll,
  useScroll,
  Environment,
  Lightformer,
  ContactShadows,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';

function ChoreographedHeroArtifact() {
  const scrollGroupRef = useRef<THREE.Group>(null!);
  const pointerGroupRef = useRef<THREE.Group>(null!);
  const coreMeshRef = useRef<THREE.Mesh>(null!);
  const ringMeshRef = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();

  // Hoist interactive state to mutable refs to prevent React reconciliation during high-frequency gestures (Standard #2)
  const hoveredRef = useRef(false);
  const pressedRef = useRef(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Respect accessibility reduced-motion preference (Standard #12)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
      document.body.style.cursor = 'auto';
    };
  }, []);

  useFrame((state, delta) => {
    const r1 = scroll.range(0, 1 / 2);
    const r2 = scroll.range(1 / 2, 1 / 2);
    const motionFactor = prefersReducedMotion.current ? 0.2 : 1.0;

    // Responsive horizontal shift so 3D object balances HTML typography
    const desktopOffset = state.viewport.width > 5 ? 1.45 : 0;
    const targetX = desktopOffset * (1 - r1 * 2 + r2 * 2);
    const targetY = -r1 * 0.4 + r2 * 0.3;
    const targetRotY = scroll.offset * Math.PI * 2.2 * motionFactor;
    const targetRotZ = (r1 * 0.6 - r2 * 0.4) * motionFactor;

    scrollGroupRef.current.position.x = THREE.MathUtils.damp(scrollGroupRef.current.position.x, targetX, 5, delta);
    scrollGroupRef.current.position.y = THREE.MathUtils.damp(scrollGroupRef.current.position.y, targetY, 5, delta);
    scrollGroupRef.current.rotation.y = THREE.MathUtils.damp(scrollGroupRef.current.rotation.y, targetRotY, 5, delta);
    scrollGroupRef.current.rotation.z = THREE.MathUtils.damp(scrollGroupRef.current.rotation.z, targetRotZ, 5, delta);

    // Independent pointer parallax with smooth velocity decay
    const parallaxX = -state.pointer.y * 0.22 * motionFactor;
    const parallaxY = state.pointer.x * 0.32 * motionFactor;
    pointerGroupRef.current.rotation.x = THREE.MathUtils.damp(pointerGroupRef.current.rotation.x, parallaxX, 7, delta);
    pointerGroupRef.current.rotation.y = THREE.MathUtils.damp(pointerGroupRef.current.rotation.y, parallaxY, 7, delta);

    // Tactile press/hover feedback on pointer-down reading from ref (zero React state re-renders)
    const targetScale = pressedRef.current ? 0.93 : hoveredRef.current ? 1.05 : 1.0;
    const nextScale = THREE.MathUtils.damp(coreMeshRef.current.scale.x, targetScale, 14, delta);
    coreMeshRef.current.scale.setScalar(nextScale);

    // Subtle orbital ring counter-rotation
    ringMeshRef.current.rotation.x += delta * 0.35 * motionFactor;
    ringMeshRef.current.rotation.y -= delta * 0.25 * motionFactor;
  });

  return (
    <group ref={scrollGroupRef}>
      <group ref={pointerGroupRef}>
        <Float speed={prefersReducedMotion.current ? 0 : 1.6} rotationIntensity={0.2} floatIntensity={0.35}>
          <mesh
            ref={coreMeshRef}
            castShadow
            onPointerOver={() => {
              hoveredRef.current = true;
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              hoveredRef.current = false;
              pressedRef.current = false;
              document.body.style.cursor = 'auto';
            }}
            onPointerDown={() => {
              pressedRef.current = true;
            }}
            onPointerUp={() => {
              pressedRef.current = false;
            }}
          >
            <icosahedronGeometry args={[1.15, 6]} />
            <meshPhysicalMaterial
              color="#e2e8f0"
              roughness={0.12}
              metalness={0.1}
              transmission={0.92}
              thickness={1.5}
              ior={1.52}
              clearcoat={1}
              clearcoatRoughness={0.08}
            />
          </mesh>

          <mesh ref={ringMeshRef} castShadow>
            <torusGeometry args={[1.75, 0.045, 32, 128]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.18} />
          </mesh>
        </Float>
      </group>
    </group>
  );
}

function StudioEnvironment() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={2.0} castShadow />
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="rect" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} color="#38bdf8" />
          <Lightformer form="ring" intensity={3} position={[10, 1, 0]} scale={8} color="#f8fafc" />
        </group>
      </Environment>
      <ContactShadows position={[0, -2.1, 0]} opacity={0.4} scale={12} blur={2.4} far={4} resolution={512} />
    </>
  );
}

export default function ScrollLandingScene() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#090a0f' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 5.5], fov: 40, near: 0.1, far: 100 }}
      >
        <Suspense fallback={null}>
          <StudioEnvironment />
          <ScrollControls pages={3} damping={0.14}>
            <ChoreographedHeroArtifact />
            <Scroll html style={{ width: '100%', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
              <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 8vw' }}>
                <div style={{ maxWidth: '34rem' }}>
                  <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.25rem)', lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}>
                    Spatial Precision in Every Frame.
                  </h1>
                  <p style={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.78, marginTop: '1.25rem' }}>
                    Continuous scroll choreography, delta-timed exponential damping, and physically grounded refractive materials.
                  </p>
                </div>
              </section>

              <section style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8vw' }}>
                <div style={{ maxWidth: '32rem' }}>
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em', margin: 0 }}>
                    Interruptible by Design.
                  </h2>
                  <p style={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.78, marginTop: '1rem' }}>
                    Reverse scroll direction or grab the artifact mid-flight without velocity discontinuities.
                  </p>
                </div>
              </section>

              <section style={{ height: '100vh', display: 'flex', alignItems: 'center', padding: '0 8vw' }}>
                <div style={{ maxWidth: '34rem' }}>
                  <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.025em', margin: 0 }}>
                    Locked at 120Hz.
                  </h2>
                  <p style={{ fontSize: '1.125rem', lineHeight: 1.6, opacity: 0.78, marginTop: '1rem' }}>
                    Zero per-frame heap allocations and isolated ref mutations keep the render thread responsive on every device.
                  </p>
                </div>
              </section>
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
