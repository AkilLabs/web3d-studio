---
name: 3d-vocabulary
description: Reverse-lookup glossary that translates vague descriptions of 3D visual effects, camera movements, materials, shaders, and physics behaviors into exact Three.js, React Three Fiber, and WebGL terminology. Use when the user asks "what is it called when..." or describes a 3D effect without knowing its technical name.
---
# 3d-vocabulary

A reverse-lookup glossary that turns everyday descriptions of 3D web effects into the exact technical terms and Three.js / React Three Fiber APIs needed to build them.

## Materials & Surface Optics

| How People Describe It | Technical Term | Three.js / R3F Implementation |
| :--- | :--- | :--- |
| "The glowing edge on a 3D sphere or hologram when viewed at an angle" | **Fresnel Effect (Rim Lighting)** | `pow(1.0 - dot(normal, viewDir), rimPower)` in GLSL or Drei `<Outlines>` |
| "Blurry see-through glass that bends whatever 3D object is behind it" | **Refractive Transmission + Roughness** | `meshPhysicalMaterial` with `transmission={0.95}`, `thickness={1.2}`, `ior={1.5}`, `roughness={0.15}` |
| "Rainbow color split at the edges of glass or a lens" | **Chromatic Aberration** | `chromaticAberration={0.04}` on Drei `<MeshTransmissionMaterial>` or post-processing `<ChromaticAberration>` |
| "Shiny car paint or ceramic look with a thin glossy layer over a matte base" | **Clearcoat** | `meshPhysicalMaterial` with `clearcoat={1.0}` and `clearcoatRoughness={0.1}` |
| "Pearlescent / soap-bubble / Apple-card color shift as the angle changes" | **Iridescence** | `meshPhysicalMaterial` with `iridescence={1.0}`, `iridescenceIOR={1.3}` |
| "Soft dark shadow right underneath a floating 3D object on a clean floor" | **Contact Shadows** | `@react-three/drei` `<ContactShadows opacity={0.4} blur={2} />` |
| "3D model that looks like a flat 2D illustration with bold outlines" | **Cel / Toon Shading + Inverted Hull Outline** | `meshToonMaterial` + Drei `<Outlines thickness={0.03} />` |

## Camera & Motion Choreography

| How People Describe It | Technical Term | Three.js / R3F Implementation |
| :--- | :--- | :--- |
| "The camera smoothly glides along a curved invisible track as you scroll" | **Spline Camera Rig** | `THREE.CatmullRomCurve3` sampled via `.getPointAt(t, vec)` inside `useFrame` |
| "The 3D object tilts slightly toward my mouse cursor and settles smoothly" | **Damped Pointer Parallax** | `THREE.MathUtils.damp(rot.y, state.pointer.x * 0.3, 6, delta)` |
| "The background stays crisp while foreground and distant 3D objects blur out" | **Depth of Field (Bokeh)** | `@react-three/postprocessing` `<DepthOfField focusDistance={...} focalLength={...} bokehScale={3} />` |
| "The camera zooms in while the background stretches or compresses (Vertigo effect)" | **Dolly Zoom (FOV Compensation)** | Simultaneously moving camera Z distance while inversely adjusting `camera.fov` and calling `camera.updateProjectionMatrix()` |
| "Gentle idle floating and bobbing motion when nobody is touching the scene" | **Procedural Sinusoidal Float** | `@react-three/drei` `<Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>` |

## Geometry, Shaders & Performance

| How People Describe It | Technical Term | Three.js / R3F Implementation |
| :--- | :--- | :--- |
| "Rendering 10,000 floating particles or cubes without lagging the browser" | **GPU Hardware Instancing** | `THREE.InstancedMesh` or `@react-three/drei` `<Instances>` |
| "A surface that ripples or morphs its actual 3D shape smoothly like liquid" | **Vertex Displacement (Simplex / Perlin Noise)** | Modifying `position` along `normal` inside the Vertex Shader using 3D noise and `uTime` |
| "Only the neon strips glow brightly without making the whole screen blurry" | **Selective HDR Emissive Bloom** | `<Bloom luminanceThreshold={1.0} mipmapBlur />` + material `toneMapped={false}` with RGB `> 1.0` |
| "A 2D card or portal that lets you peer into a completely separate 3D world inside it" | **Render Target Portal (Stencil / FBO)** | `@react-three/drei` `<MeshPortalMaterial>` or `useFBO()` |
