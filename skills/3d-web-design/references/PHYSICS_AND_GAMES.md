# 3D Browser Games & Physics Reference

Engineering patterns for building responsive 3D browser games, character controllers, vehicle mechanics, and physics simulations using `@react-three/rapier` (R3F) and `cannon-es` (vanilla Three.js).

## 1. Physics World Setup & Timestep Interpolation

Physics engines require deterministic stepping while monitors refresh at 60Hz, 120Hz, or 144Hz:

- In `@react-three/rapier`, wrap game entities in `<Physics interpolate timeStep={1 / 60}>` (or `timeStep="vary"` for lightweight arcade scenes). Keeping `interpolate={true}` ensures Rapier smoothly interpolates mesh transforms between fixed physics ticks so high-refresh monitors never exhibit micro-stutter.
- Set gravity slightly higher than Earth normal (`gravity={[0, -20, 0]}` instead of `-9.81`) for platformers and arcade games. Standard `-9.81` gravity often feels floaty and sluggish in 3D games unless combined with a higher falling gravity multiplier.

## 2. RigidBody Archetypes & Collider Selection

Always pick the simplest mathematical collider shape that approximates the mesh:

| Collider Shape | Best Use Case | Performance Cost |
| --- | --- | --- |
| `BallCollider` (`ball`) | Marbles, boulders, spherical projectiles | Lowest (analytical distance check) |
| `CapsuleCollider` (`capsule`) | Bipedal characters, bots, players | Very Low (slides smoothly over steps/edges) |
| `CuboidCollider` (`cuboid`) | Crates, walls, platforms, triggers | Low |
| `CylinderCollider` (`cylinder`) | Pillars, coins, barrels, wheels | Low-Medium |
| `ConvexHullCollider` (`hull`) | Irregular dynamic props, vehicles, rocks | Medium (shrink-wrapped convex hull) |
| `TrimeshCollider` (`trimesh`) | Complex static terrain and concave rooms | High (use ONLY on `type="fixed"` bodies) |

- **Never use `colliders="trimesh"` on dynamic moving bodies**: Dynamic trimesh-to-trimesh collisions are computationally expensive and prone to tunneling. Use compound cuboids/capsules or `colliders="hull"` for moving objects.
- **Enable Continuous Collision Detection (`ccd={true}`)** on fast-moving projectiles or high-speed player controllers so they never tunnel through thin walls at low frame rates.

## 3. Arcade Character Controller with Ground Raycasting

A responsive 3D character controller must accelerate snappily, stop without sliding like ice, and jump reliably using a ground check plus coyote time:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

const moveDir = new THREE.Vector3();
const bodyWorldPos = new THREE.Vector3();
const camTargetPos = new THREE.Vector3();
const camLookTarget = new THREE.Vector3();

export function ArcadePlayer() {
  const bodyRef = useRef<RapierRigidBody>(null!);
  const lastGroundedTime = useRef(0);
  const lastJumpPressedTime = useRef(-1);
  const { rapier, world } = useRapier();
  const [, getKeys] = useKeyboardControls();

  useFrame((state, delta) => {
    const body = bodyRef.current;
    if (!body) return;

    const now = state.clock.elapsedTime;
    const { forward, backward, left, right, jump } = getKeys();

    // 1. Ground check via short downward raycast from capsule bottom
    const origin = body.translation();
    const ray = new rapier.Ray({ x: origin.x, y: origin.y - 0.85, z: origin.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(ray, 0.25, true);
    if (hit && hit.timeOfImpact <= 0.2) {
      lastGroundedTime.current = now;
    }

    if (jump) {
      lastJumpPressedTime.current = now;
    }

    // 2. Horizontal movement with frame-rate independent damping
    const inputX = Number(right) - Number(left);
    const inputZ = Number(backward) - Number(forward);
    moveDir.set(inputX, 0, inputZ);
    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const maxSpeed = 7.5;
    const currentVel = body.linvel();
    const accelLambda = hit ? 16 : 8; // Full control on ground, softer air control

    const nextVx = THREE.MathUtils.damp(currentVel.x, moveDir.x * maxSpeed, accelLambda, delta);
    const nextVz = THREE.MathUtils.damp(currentVel.z, moveDir.z * maxSpeed, accelLambda, delta);
    let nextVy = currentVel.y;

    // 3. Coyote time (120ms) + jump buffer (120ms)
    const canCoyoteJump = now - lastGroundedTime.current < 0.12;
    const hasBufferedJump = now - lastJumpPressedTime.current < 0.12;
    if (canCoyoteJump && hasBufferedJump) {
      nextVy = 9.2;
      lastGroundedTime.current = -1;
      lastJumpPressedTime.current = -1;
    }

    body.setLinvel({ x: nextVx, y: nextVy, z: nextVz }, true);

    // 4. Smooth follow camera with zero per-frame allocations
    bodyWorldPos.set(origin.x, origin.y, origin.z);
    camTargetPos.set(origin.x, origin.y + 4.2, origin.z + 7.5);
    state.camera.position.lerp(camTargetPos, 1 - Math.exp(-8 * delta));
    camLookTarget.lerp(bodyWorldPos, 1 - Math.exp(-12 * delta));
    state.camera.lookAt(camLookTarget);
  });

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      mass={1}
      position={[0, 2, 0]}
      enabledRotations={[false, false, false]}
      ccd
    >
      <CapsuleCollider args={[0.45, 0.4]} friction={0.1} />
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 0.9, 16, 32]} />
        <meshStandardMaterial color="#f5f5f7" roughness={0.2} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}
```

## 4. Kinematic Obstacles & Moving Platforms

Never animate a physics obstacle by changing `<RigidBody position={[x, y, z]}>` props every frame. Use `type="kinematicPosition"` and update its kinematic target in `useFrame`:

```tsx
const nextPlatformPos = { x: 0, y: 0, z: 0 };
const nextPlatformRot = new THREE.Quaternion();
const eulerScratch = new THREE.Euler();

useFrame((state) => {
  const t = state.clock.elapsedTime;
  nextPlatformPos.x = Math.sin(t * 1.5) * 4;
  nextPlatformPos.y = 1.0;
  nextPlatformPos.z = -6;
  platformBodyRef.current?.setNextKinematicTranslation(nextPlatformPos);

  eulerScratch.set(0, t * 1.2, 0);
  nextPlatformRot.setFromEuler(eulerScratch);
  spinnerBodyRef.current?.setNextKinematicRotation(nextPlatformRot);
});
```

## 5. Sensors, Triggers, and Collision Filtering

- **Collectibles, checkpoints, and hazard zones**: Add `sensor` to a `<CuboidCollider sensor onIntersectionEnter={handlePickup} />`. Sensors detect overlap events without imparting physical collision forces that would slow down the player.
- **Collision groups (`interactionGroups`)**: Use bitmasks (`interactionGroups(memberships, filter)`) when player projectiles or camera whiskers should ignore the player's own collider while still hitting enemies and walls.
