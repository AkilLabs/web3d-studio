# 3D Web Design & Engineering Standards (STANDARDS.md)

Use this document when auditing, reviewing, or validating Three.js and React Three Fiber (R3F) code. Default to flagging violations; approval is earned only when all 12 standards pass.

## The 12 Non-Negotiable Standards

### Standard 1: Frame-Rate Independent Motion (`delta` Damping)

- **Rule**: Never interpolate positions, rotations, scales, or shader uniforms using a fixed per-frame fraction (`x += (target - x) * 0.08` or `vec.lerp(target, 0.1)`).
- **Requirement**: Always use exponential decay parameterized by frame `delta`: `THREE.MathUtils.damp(current, target, lambda, delta)` or `1 - Math.exp(-lambda * delta)` for vector/quaternion lerps (`vec.lerp(target, 1 - Math.exp(-lambda * delta))`).
- **Why**: Fixed-factor lerps run twice as fast on 120Hz ProMotion displays and stall on 30Hz low-power devices.

### Standard 2: Zero React State Updates in the Render Loop

- **Rule**: Never call React `useState` setters (`setPos`, `setRotation`, `setScroll`, `setProgress`) inside `useFrame` or `requestAnimationFrame`.
- **Requirement**: Mutate Three.js object references (`ref.current.position`, `ref.current.rotation`, `materialRef.current.uniforms`) directly inside `useFrame`. Use Zustand transient subscriptions (`useStore.subscribe(...)` or `useStore.getState()`) to read rapidly changing state inside `useFrame` without triggering component re-renders.

### Standard 3: Zero Heap Allocations in `useFrame`

- **Rule**: Never instantiate `new THREE.Vector3()`, `new THREE.Quaternion()`, `new THREE.Euler()`, `new THREE.Matrix4()`, `new THREE.Color()`, or `new THREE.Raycaster()` inside `useFrame` or `requestAnimationFrame`.
- **Requirement**: Hoist reusable scratch instances outside the component (module scope) or memoize them once via `useMemo`.
- **Why**: Allocating 5 vectors per frame across 20 components creates 12,000 objects per second at 120fps, triggering garbage collection freezes every few seconds.

### Standard 4: Clamped Device Pixel Ratio (`dpr`)

- **Rule**: Never leave WebGL pixel ratio unbounded on high-DPI displays.
- **Requirement**: Set `dpr={[1, 2]}` on R3F `<Canvas>` (or `[1, 1.5]` for heavy raymarching/post-processing scenes) and `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` in vanilla Three.js.

### Standard 5: Immediate Tactile Response & Interruptibility

- **Rule**: Interactive 3D objects must respond on `onPointerDown` (not only on click release) and must be interruptible mid-flight.
- **Requirement**: Avoid fixed-duration, non-interruptible tween chains for user-driven gestures. Read from the live presentation value on every frame and damp toward the active state (`pressed -> hovered -> idle`). Always set `document.body.style.cursor = 'pointer'` on `onPointerOver` and restore `'auto'` on `onPointerOut` and unmount.

### Standard 6: Physics Solver Integrity

- **Rule**: Never mutate `mesh.position` or `mesh.rotation` directly on a mesh controlled by a physics `<RigidBody>`.
- **Requirement**: Drive `dynamic` bodies with `body.setLinvel()`, `body.applyImpulse()`, or `body.addForce()`. Drive moving platforms or pointer-tracked obstacles with `type="kinematicPosition"` and `body.setNextKinematicTranslation()` / `body.setNextKinematicRotation()`.

### Standard 7: Physically Plausible Materials & Environment Lighting

- **Rule**: Never use `MeshStandardMaterial` or `MeshPhysicalMaterial` without an environment map, and never set `roughness: 0.0` or `roughness: 1.0`.
- **Requirement**: Keep polished surfaces in `roughness: 0.08 - 0.25` and matte surfaces in `roughness: 0.65 - 0.88`. Provide `<Environment />` (or `PMREMGenerator` environment lighting) alongside directional/spot key lights so metallic and specular highlights read accurately.

### Standard 8: Spatial Grounding (Shadows & Depth)

- **Rule**: 3D objects must never float in space without visual anchoring to their surroundings.
- **Requirement**: Use `<ContactShadows />` for hero/product stages or configure directional shadow maps (`shadow-mapSize={[2048, 2048]}`, tight shadow camera frustum `-10..10`, and `shadow-bias={-0.0005}` to prevent shadow acne).

### Standard 9: Draw Call Discipline & Geometry Instancing

- **Rule**: Never render more than 50 identical meshes via `.map()` in JSX or a vanilla Three.js loop.
- **Requirement**: Collapse repeated geometry into `THREE.InstancedMesh` or `@react-three/drei`'s `<Instances>`. Keep total scene draw calls (`gl.info.render.calls`) below 100 on desktop and below 50 on mobile.

### Standard 10: Selective HDR Post-Processing

- **Rule**: Never apply full-screen low-threshold bloom (`luminanceThreshold < 0.8`) that washes out UI contrast and non-emissive surfaces.
- **Requirement**: Set `<Bloom luminanceThreshold={1.0} mipmapBlur />` and opt specific emissive materials into bloom by setting `toneMapped={false}` and pushing RGB channels above `1.0`.

### Standard 11: Explicit GPU Resource Disposal

- **Rule**: Custom geometries, materials, textures, and render targets created imperatively must not leak when components unmount or scenes switch.
- **Requirement**: Call `.dispose()` on imperatively created geometries, materials, textures, and `WebGLRenderTarget` instances inside `useEffect` cleanup functions (or scene teardown in vanilla Three.js).

### Standard 12: Accessibility & Reduced Motion

- **Rule**: Heavy 3D camera motion, orbital spin, and scroll fly-throughs must respect user vestibular preferences.
- **Requirement**: Check `window.matchMedia('(prefers-reduced-motion: reduce)')`. When active, set idle rotation/parallax multipliers to `0`, disable camera shake, and step between camera viewpoints smoothly without rapid translation sweeps.

## Review Output Format

When asked to review or audit a 3D scene or component, output:

1. **Part 1 - Findings Table**:

| Standard | Before (Found in Code) | After (Required Fix) | Why |
| --- | --- | --- | --- |
| #1 Delta Damping | `camera.position.lerp(target, 0.05)` | `camera.position.lerp(target, 1 - Math.exp(-6 * delta))` | Frame-rate dependent camera speed breaks on 120Hz displays |

2. **Part 2 - Verdict**: State **APPROVE** (zero blocking violations) or **BLOCK** (one or more standards violated, listing exact line fixes).
