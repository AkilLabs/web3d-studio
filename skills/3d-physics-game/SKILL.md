---
name: 3d-physics-game
description: Build responsive 3D browser games, character controllers, and interactive physics simulations with React Three Fiber (@react-three/rapier) and Three.js (cannon-es). Use when creating 3D platformers, arcade games, vehicle physics, kinematic obstacles, or collision systems.
---
# 3d-physics-game

Build 3D browser games that feel crisp, responsive, and deterministic across 60Hz and 120Hz displays.

## Core Engineering Rules for 3D Web Games

1. **Interpolate the physics timestep**: Always enable `<Physics interpolate timeStep={1 / 60} gravity={[0, -22, 0]}>` so visual meshes interpolate smoothly between physics ticks on 120Hz monitors, and use crisp arcade gravity (`-20` to `-25`) so jumps never feel floaty.
2. **Drive player velocity, not raw forces**: Applying raw `addForce` for WASD movement feels like skating on ice. Read normalized input vectors, damp `linvel.x` and `linvel.z` with `THREE.MathUtils.damp(currentVel, targetVel, 15, delta)`, and preserve `linvel.y` for gravity.
3. **Implement raycast ground checks + coyote time**: Cast a short downward Rapier ray (`0.25` units) from the bottom of the player's `CapsuleCollider`. Allow jumping within `120ms` of leaving a ledge (coyote time) and buffer jump presses `120ms` before landing.
4. **Use `kinematicPosition` for moving obstacles**: Never mutate `mesh.position` inside a `<RigidBody>`. Drive moving platforms and rotating hazards via `body.setNextKinematicTranslation()` and `body.setNextKinematicRotation()`.
5. **Pre-allocate all math vectors outside `useFrame`**: Hoist camera offset, player position, and input direction `THREE.Vector3` instances to module scope so garbage collection never freezes gameplay.
