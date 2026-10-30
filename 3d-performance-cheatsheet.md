# 3D Web Performance Cheatsheet (60-120fps Budget)

Quick-reference engineering rules for keeping Three.js and React Three Fiber scenes locked at display refresh rate across desktop and mobile.

## Frame Budget Targets

| Metric | Desktop Target (120Hz) | Mobile Target (60Hz) | How to Measure |
| :--- | :--- | :--- | :--- |
| Frame Time | `< 8.3ms` | `< 16.6ms` | `r3f-perf` or Chrome DevTools Performance |
| Draw Calls | `< 100` | `< 50` | `gl.info.render.calls` |
| Active Triangles | `< 500,000` | `< 150,000` | `gl.info.render.triangles` |
| Device Pixel Ratio (DPR) | `[1, 2]` | `[1, 1.5]` | `<Canvas dpr={[1, 2]}>` |
| Shadow Map Size | `2048 x 2048` | `1024 x 1024` | `shadow-mapSize={[2048, 2048]}` |
| Texture Memory | `< 128 MB` (`KTX2` / `.webp`) | `< 64 MB` | `gl.info.memory.textures` |

## The 7 Golden Rules of R3F & Three.js Performance

1. **Never call `setState` in `useFrame`**: Mutate `ref.current` directly. Use Zustand's `useStore.getState()` or `useStore.subscribe()` for transient state reads inside the loop.
2. **Zero `new THREE.*` allocations in `useFrame`**: Hoist scratch `Vector3`, `Quaternion`, `Euler`, `Matrix4`, and `Color` instances to module scope.
3. **Always damp with `delta`**: Replace `x += (target - x) * 0.1` with `THREE.MathUtils.damp(x, target, lambda, delta)` so motion speed stays identical at 60Hz and 120Hz.
4. **Instance anything > 50 copies**: Use `<Instances>` or `THREE.InstancedMesh` so hundreds of repeated props issue a single draw call.
5. **Preload and compress models**: Compress `.glb` assets with Draco or Meshopt and call `useGLTF.preload('/model.glb')` at module top level.
6. **Use `frameloop="demand"` for static viewers**: If a product showcase only changes when the user drags or clicks, render on demand and call `invalidate()` on interaction.
7. **Scale quality dynamically**: Wrap post-processing and DPR in `@react-three/drei`'s `<PerformanceMonitor>` to step down pixel ratio automatically on weaker GPUs.
