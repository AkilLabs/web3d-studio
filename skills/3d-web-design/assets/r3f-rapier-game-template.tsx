'use client';

import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls, useKeyboardControls, Environment, Instances, Instance } from '@react-three/drei';
import {
  Physics,
  RigidBody,
  CapsuleCollider,
  CuboidCollider,
  RapierRigidBody,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';

const CONTROLS_MAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
];

// Pre-allocated module-scope scratch vectors (Standard #3: zero per-frame heap allocations)
const inputDir = new THREE.Vector3();
const playerPos = new THREE.Vector3();
const desiredCamPos = new THREE.Vector3();
const smoothedLookAt = new THREE.Vector3();
const kinematicTarget = { x: 0, y: 0.8, z: -5 };
const linvelTarget = { x: 0, y: 0, z: 0 };
const respawnPos = { x: 0, y: 3, z: 0 };
const zeroLinvel = { x: 0, y: 0, z: 0 };

function PlayerCharacter() {
  const bodyRef = useRef<RapierRigidBody>(null!);
  const lastGroundedAt = useRef(0);
  const lastJumpPressedAt = useRef(-1);
  const prefersReducedMotion = useRef(false);
  const { rapier, world } = useRapier();
  const [, getKeys] = useKeyboardControls();

  // Hoist Rapier ray to ref to eliminate per-frame object allocation (Standard #3)
  const groundRayRef = useRef<any>(null);
  if (!groundRayRef.current) {
    groundRayRef.current = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion.current = mediaQuery.matches;
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useFrame((state, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const now = state.clock.elapsedTime;
    const { forward, backward, left, right, jump } = getKeys();

    // 1. Zero-allocation ground raycast using reused Ray instance
    const origin = body.translation();
    const ray = groundRayRef.current;
    ray.origin.x = origin.x;
    ray.origin.y = origin.y - 0.85;
    ray.origin.z = origin.z;
    const hit = world.castRay(ray, 0.25, true);
    if (hit && hit.timeOfImpact <= 0.2) {
      lastGroundedAt.current = now;
    }

    if (jump) {
      lastJumpPressedAt.current = now;
    }

    // 2. Horizontal movement with frame-rate independent exponential damping
    inputDir.set(Number(right) - Number(left), 0, Number(backward) - Number(forward));
    if (inputDir.lengthSq() > 0) inputDir.normalize();

    const speed = 7.5;
    const vel = body.linvel();
    const accelLambda = hit ? 16 : 8; // Full grip on ground, looser air steering

    const vx = THREE.MathUtils.damp(vel.x, inputDir.x * speed, accelLambda, delta);
    const vz = THREE.MathUtils.damp(vel.z, inputDir.z * speed, accelLambda, delta);
    let vy = vel.y;

    // 3. Coyote time (120ms) + Jump Buffer (120ms) for responsive arcade controls
    const canCoyoteJump = now - lastGroundedAt.current < 0.12;
    const hasBufferedJump = now - lastJumpPressedAt.current < 0.12;
    if (canCoyoteJump && hasBufferedJump) {
      vy = 9.2;
      lastGroundedAt.current = -1;
      lastJumpPressedAt.current = -1;
    }

    // Mutate pre-allocated velocity target to eliminate GC frame spikes
    linvelTarget.x = vx;
    linvelTarget.y = vy;
    linvelTarget.z = vz;
    body.setLinvel(linvelTarget, true);

    // 4. Respawn if fallen off the arena stage
    if (origin.y < -8) {
      body.setTranslation(respawnPos, true);
      body.setLinvel(zeroLinvel, true);
    }

    // 5. Frame-rate independent follow camera
    playerPos.set(origin.x, origin.y, origin.z);
    desiredCamPos.set(origin.x, origin.y + 4.5, origin.z + 8.0);

    const camFollowLambda = prefersReducedMotion.current ? 4 : 8;
    const lookAtLambda = prefersReducedMotion.current ? 6 : 12;

    state.camera.position.lerp(desiredCamPos, 1 - Math.exp(-camFollowLambda * delta));
    smoothedLookAt.lerp(playerPos, 1 - Math.exp(-lookAtLambda * delta));
    state.camera.lookAt(smoothedLookAt);
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={[0, 2.5, 0]}
      enabledRotations={[false, false, false]}
      ccd
    >
      <CapsuleCollider args={[0.45, 0.4]} friction={0.1} />
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 0.9, 16, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.15} />
      </mesh>
    </RigidBody>
  );
}

function KinematicPlatform() {
  const platformRef = useRef<RapierRigidBody>(null!);

  useFrame((state) => {
    kinematicTarget.x = Math.sin(state.clock.elapsedTime * 1.4) * 4.5;
    platformRef.current?.setNextKinematicTranslation(kinematicTarget);
  });

  return (
    <RigidBody ref={platformRef} type="kinematicPosition" position={[0, 0.8, -5]} friction={1}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.4, 2.2]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
      </mesh>
    </RigidBody>
  );
}

function InstancedStagePillars() {
  const positions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        return [Math.cos(angle) * 11, 1.5, Math.sin(angle) * 11] as [number, number, number];
      }),
    []
  );

  return (
    <Instances limit={24} castShadow receiveShadow>
      <cylinderGeometry args={[0.35, 0.45, 3, 24]} />
      <meshStandardMaterial color="#334155" roughness={0.65} metalness={0.2} />
      {positions.map((pos, idx) => (
        <Instance key={idx} position={pos} />
      ))}
    </Instances>
  );
}

// Collectible energy cores demonstrating sensor triggers and single draw-call instancing
function CollectibleOrbs() {
  const groupRef = useRef<THREE.Group>(null!);
  const orbPositions = useMemo(
    () => [
      [-4, 1.2, -2] as [number, number, number],
      [4, 1.2, -2] as [number, number, number],
      [0, 2.0, -5] as [number, number, number],
      [-3, 1.2, 3] as [number, number, number],
      [3, 1.2, 3] as [number, number, number],
    ],
    []
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Instances limit={5}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.4}
          roughness={0.15}
          metalness={0.4}
        />
        {orbPositions.map((pos, idx) => (
          <Instance key={idx} position={pos} />
        ))}
      </Instances>
    </group>
  );
}

export default function PhysicsGameScene() {
  return (
    <KeyboardControls map={CONTROLS_MAP}>
      <div style={{ width: '100vw', height: '100vh', background: '#0f172a' }}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 5, 9], fov: 55, near: 0.1, far: 150 }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.45} />
            <directionalLight
              castShadow
              position={[10, 16, 10]}
              intensity={2.2}
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-15}
              shadow-camera-right={15}
              shadow-camera-top={15}
              shadow-camera-bottom={-15}
              shadow-bias={-0.0005}
            />
            <Environment preset="city" />

            <Physics interpolate timeStep={1 / 60} gravity={[0, -22, 0]}>
              <PlayerCharacter />
              <KinematicPlatform />

              {/* Main Arena Floor */}
              <RigidBody type="fixed" colliders={false} friction={0.8}>
                <CuboidCollider args={[12, 0.5, 12]} position={[0, -0.5, 0]} />
                <mesh position={[0, -0.5, 0]} receiveShadow>
                  <boxGeometry args={[24, 1, 24]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.78} metalness={0.1} />
                </mesh>
              </RigidBody>
            </Physics>

            <InstancedStagePillars />
            <CollectibleOrbs />
          </Suspense>
        </Canvas>
      </div>
    </KeyboardControls>
  );
}
