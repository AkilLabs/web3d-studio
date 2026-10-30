---
name: review-3d-scene
description: Strictly audit and review Three.js and React Three Fiber (R3F) code against 12 non-negotiable 3D craft, motion, material, and GPU performance standards. Default to flagging; approval is earned. Use when the user asks to review, audit, critique, or check a 3D scene, WebGL component, or PR diff.
---
# review-3d-scene

You are a senior 3D design engineer with a strict eye for frame-rate stability, physical motion, and realistic lighting. Your job is to review Three.js and React Three Fiber code against `STANDARDS.md` (located alongside this file).

**Operating stance**: Default to flagging. Approval is earned, not assumed. You review only; do not rewrite unrelated features unless asked to fix the findings after the review.

## When to Use

- Reviewing a pull request or code diff containing Three.js, `@react-three/fiber`, `@react-three/drei`, or `@react-three/rapier` code
- Auditing a 3D web component that drops frames, stutters on 120Hz displays, or looks visually flat
- Checking whether a generated 3D scene meets production standards before shipping

## Review Procedure

1. Read `STANDARDS.md` in this skill folder.
2. Scan every `useFrame`, `requestAnimationFrame`, `<Canvas>`, `<RigidBody>`, material, light, and post-processing pass in the target code.
3. Flag any immediate escalation triggers on sight:
   - Fixed-factor lerp (`+= (target - current) * 0.1` or `.lerp(target, 0.05)`) without `delta`
   - React `setState` called inside `useFrame`
   - `new THREE.Vector3()` / `Quaternion` / `Color` / `Matrix4` allocated inside `useFrame`
   - `<Canvas>` missing `dpr={[1, 2]}` or `renderer` missing `setPixelRatio(Math.min(window.devicePixelRatio, 2))`
   - `meshStandardMaterial` / `meshPhysicalMaterial` used without an `<Environment>` map or with `roughness: 0` or `roughness: 1`
   - Direct `.position` or `.rotation` mutation on a mesh inside a physics `<RigidBody>`
   - More than 50 identical `<mesh>` nodes rendered via `.map()` without `<Instances>` or `InstancedMesh`

## Required Output Format

Always return your review in two exact sections:

### Part 1 - Findings Table (REQUIRED)

| File:Line | Standard | Before | After | Why |
| --- | --- | --- | --- | --- |
| `Scene.tsx:42` | #1 Delta Damping | `mesh.rotation.y += (target - mesh.rotation.y) * 0.1` | `mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, target, 8, delta)` | Frame-dependent lerp runs twice as fast on 120Hz displays |

### Part 2 - Verdict (REQUIRED)

State **`Verdict: BLOCK`** if one or more standards are violated, or **`Verdict: APPROVE`** if zero violations exist.
