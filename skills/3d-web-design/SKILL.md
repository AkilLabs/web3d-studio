---
name: 3d-web-design
description: Build, review, and optimize fluid, high-craft 3D web experiences, scroll-driven 3D landing pages, and physics-based 3D browser games using Three.js and React Three Fiber (React/Next.js). Use when creating, auditing, or refactoring Three.js scenes, R3F (@react-three/fiber and @react-three/drei) components, scroll choreography, 3D product configurators, WebGL/GLSL shaders, Rapier/Cannon physics games, PBR studio lighting and materials, or 3D web performance.
---
# 3d-web-design

A multi-file design engineering skill for building, reviewing, and optimizing 3D web experiences, scroll-driven landing pages, and physics-based 3D browser games in Three.js and React Three Fiber (React/Next.js).

## Bundled Skill Architecture

Load the relevant bundled resources based on the task:

- `references/STANDARDS.md`: 12 non-negotiable 3D craft, motion, material, and GPU performance standards with exact numerical bounds and a `Before | After | Why` review rubric. Load when auditing existing 3D code or verifying production quality.
- `references/SCROLL_AND_CAMERA_CHOREOGRAPHY.md`: Architectural patterns for scroll-driven 3D landing pages, spline camera rigs, pointer parallax, velocity handoff, and HTML-to-WebGL layout synchronization. Load when building interactive 3D websites or product showcases.
- `references/PHYSICS_AND_GAMES.md`: Patterns for 3D browser games using `@react-three/rapier` and `cannon-es`, damped character controllers, kinematic platforms, collision groups, and zero-allocation game loops. Load when building 3D games or interactive physics simulations.
- `references/SHADERS_LIGHTING_POSTPROCESSING.md`: Studio 3-point lighting rigs, PMREM environment maps, realistic PBR material calibration, custom `shaderMaterial` GLSL patterns, and selective post-processing. Load when styling scenes, writing shaders, or tuning visual fidelity.
- `assets/r3f-scroll-landing-template.tsx`: Production React Three Fiber + Drei scroll-driven landing page template with damped camera choreography and HTML overlays.
- `assets/r3f-rapier-game-template.tsx`: Production React Three Fiber + Rapier physics game template with keyboard controls, capsule player controller, and instanced collectibles.
- `assets/vanilla-three-starter.html`: Self-contained single-file runnable Three.js HTML template with ES module import maps, damped interaction, and studio lighting for instant previewing.
- `scripts/audit_3d_code.mjs`: Fast zero-dependency Node.js static analyzer that inspects `.tsx`, `.ts`, `.jsx`, `.js`, and `.html` files for 3D performance and motion anti-patterns (allocations in `useFrame`, missing DPR clamps, raw frame-dependent lerps, React state in render loops, and un-instanced mesh loops).
- `scripts/audit_3d_code.py`: Python static analyzer equivalent for CI/CD or Python-native environments.

## When to Use

- Creating interactive 3D websites, scroll-driven 3D landing pages, or 3D product showcases in React, Next.js, or vanilla Three.js
- Building 3D browser games, character controllers, vehicle mechanics, or physics simulations with `@react-three/rapier` or `cannon-es`
- Designing damped 3D camera rigs, gesture-driven object inspection, or custom GLSL shaders and post-processing pipelines
- Reviewing or auditing 3D web code against strict frame-budget, motion, and visual craft standards

## Core Workflow

### Step 1: Classify the Project and Load Reference Modules

Identify which archetype matches the user's request and load the matching reference and starter template from this skill before writing code:

1. **Interactive 3D Website / Scroll-Driven Landing Page**: Load `references/SCROLL_AND_CAMERA_CHOREOGRAPHY.md`, `references/SHADERS_LIGHTING_POSTPROCESSING.md`, and `assets/r3f-scroll-landing-template.tsx` (or `assets/vanilla-three-starter.html` if a standalone HTML preview is requested).
2. **3D Browser Game / Physics Simulation**: Load `references/PHYSICS_AND_GAMES.md` and `assets/r3f-rapier-game-template.tsx`.
3. **3D Code Review / Performance Audit**: Load `references/STANDARDS.md` and run `node scripts/audit_3d_code.mjs <path>` (or `python3 scripts/audit_3d_code.py <path>`) on the target codebase.

### Step 2: Isolate the Render Loop and Enforce Frame Budget

A 3D interface loses its physical illusion the instant a frame drops. Keep the 60 to 120fps WebGL render loop decoupled from UI framework reconciliation:

- **Never call React `setState` inside `useFrame`**: Mutate Three.js object refs (`meshRef.current.position`, `materialRef.current.uniforms`) directly inside `useFrame`. Restrict React state to discrete lifecycle events (`onPointerDown`, game over, level transitions). For hover and pressed animations, read from mutable `useRef(false)` inside `useFrame` to avoid component re-renders.
- **Zero heap allocations per frame**: Never instantiate `new THREE.Vector3()`, `new THREE.Quaternion()`, `new THREE.Matrix4()`, `new THREE.Color()`, or `new rapier.Ray()` inside `useFrame` or `requestAnimationFrame`. Pre-allocate scratch objects at module scope and reuse a memoized `groundRayRef` for physics queries.
- **Clamp Device Pixel Ratio**: Always set `dpr={[1, 2]}` on `<Canvas>` or `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` so 3x and 4x mobile screens do not multiply fragment shader load by 9x to 16x.
- **Instance repeated meshes**: Use `THREE.InstancedMesh` or Drei's `<Instances>` whenever rendering more than 50 identical geometries to keep total draw calls under 100 on desktop and under 50 on mobile.

### Step 3: Apply Frame-Rate Independent Damping and Interruptibility

Every 3D camera transition, pointer tilt, and scroll scrub must be continuous, interruptible, and invariant across 60Hz, 120Hz, and 144Hz monitors:

- **Use exponential decay with `delta`**: Never write `pos.x += (target - pos.x) * 0.1`. Always use `THREE.MathUtils.damp(current, target, lambda, delta)` or `maath/easing` (`damp3`, `dampE`, `dampQ`).
- **Animate from the live presentation value**: When a user interrupts a camera move or reverses scroll direction, damp from the current live transform (`meshRef.current.position`) toward the new target so velocity blends smoothly without snapping.
- **Deliver immediate tactile feedback on pointer-down**: Respond on `onPointerDown` (for example, damping scale toward `0.94` with `lambda = 14`), not just on click release. Update cursor states cleanly on `onPointerOver` and `onPointerOut`.

### Step 4: Calibrate Physically Based Lighting and Materials

Avoid the flat, artificial look of default WebGL scenes by grounding every surface in realistic light response:

- **Pair PBR materials with an Environment map**: `MeshStandardMaterial` and `MeshPhysicalMaterial` require environmental reflections (`<Environment />` or `PMREMGenerator`).
- **Keep roughness within physical bounds**: Never use `roughness: 0.0` (unnatural mirror) or `roughness: 1.0` (dead chalk). Calibrate polished surfaces to `0.08 - 0.25` and matte surfaces to `0.65 - 0.88`.
- **Ground objects with shadows**: Add `<ContactShadows />` for floating showcase objects or configure tight directional shadow frustums (`shadow-mapSize={[2048, 2048]}`, `shadow-bias={-0.0005}`) for dynamic game scenes.
- **Respect reduced motion**: Query `prefers-reduced-motion: reduce` and disable continuous camera sway, heavy scroll fly-throughs, and camera shake when active.

### Step 5: Verify With the Static Audit Script

Before delivering generated or refactored 3D code files, run the bundled verification script:

```bash
# Node.js (recommended for JavaScript/TypeScript environments)
node skills/3d-web-design/scripts/audit_3d_code.mjs <path-to-file-or-dir>

# Or Python 3
python3 skills/3d-web-design/scripts/audit_3d_code.py <path-to-file-or-dir>
```

Resolve all flagged `[BLOCK]` findings before presenting the final output.

Resolve all flagged `[BLOCK]` findings before presenting the final output.

## Gotchas

- **Raw lerp inside `useFrame`**: `a += (b - a) * 0.1` runs twice as fast at 120fps as at 60fps. Always pass `delta` into `THREE.MathUtils.damp(a, b, lambda, delta)`.
- **Direct transform mutation on physics bodies**: Mutating `mesh.position` inside a `<RigidBody>` fights the physics solver and causes severe jitter. Use `body.setNextKinematicTranslation()` or `body.setLinvel()`.
- **Uncompressed or un-preloaded GLTF models**: Call `useGLTF.preload('/model.glb')` at module level and wrap `<Canvas>` contents in `<Suspense>` so asset loading never blocks the UI thread.
- **Indiscriminate bloom**: Setting bloom threshold to `0` washes out the entire scene. Set `luminanceThreshold={1.0}` with `mipmapBlur` and push only emissive materials above `1.0` with `toneMapped={false}`.

## Quick Reference

| Need | Technique | Concrete Value |
| --- | --- | --- |
| Tactile press / hover damp | `THREE.MathUtils.damp(cur, target, lambda, delta)` | `lambda: 12` to `16` |
| Pointer parallax / follow damp | `THREE.MathUtils.damp(cur, target, lambda, delta)` | `lambda: 5` to `8` |
| Camera rig / scroll scrub damp | `THREE.MathUtils.damp(cur, target, lambda, delta)` | `lambda: 3` to `5` |
| Device pixel ratio ceiling | `<Canvas dpr={[1, 2]}>` | Max `2` (`1.5` for heavy shaders) |
| Camera field of view (FOV) | Perspective camera `fov` | `35` to `45` deg (showcase); `50` to `65` deg (games) |
| Polished PBR roughness | `meshStandardMaterial` / `meshPhysicalMaterial` | `roughness: 0.08` to `0.25` |
| Matte PBR roughness | `meshStandardMaterial` | `roughness: 0.65` to `0.88` |
| Character horizontal movement | `body.setLinvel({ x, y: linvel.y, z }, true)` | Damp `x` and `z` with `lambda: 12` to `16` |
| Selective emissive bloom | `<Bloom luminanceThreshold={1.0} mipmapBlur />` | Material `toneMapped={false}` + RGB `> 1.0` |
| Draw call budget | `renderer.info.render.calls` | `< 100` desktop, `< 50` mobile |
