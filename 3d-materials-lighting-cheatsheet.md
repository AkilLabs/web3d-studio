# 3D Materials, Studio Lighting & Post-Processing Cheatsheet

Concrete values for physically based rendering (PBR), lighting ratios, and camera optics in Three.js and React Three Fiber.

## Physically Plausible Material Recipes

Never use `roughness: 0.0` (impossible mirror) or `roughness: 1.0` (dead chalk). Real materials live inside `0.08 - 0.88`.

| Surface Material | Three.js Material | Concrete Parameters |
| :--- | :--- | :--- |
| **Anodized Aluminum** | `meshStandardMaterial` | `color="#d4d4d8"`, `metalness={0.88}`, `roughness={0.22}`, `envMapIntensity={1.2}` |
| **Brushed Titanium** | `meshPhysicalMaterial` | `color="#a1a1aa"`, `metalness={0.92}`, `roughness={0.28}`, `clearcoat={0.15}`, `clearcoatRoughness={0.3}` |
| **Optical Refractive Glass** | `meshPhysicalMaterial` | `transmission={0.95}`, `roughness={0.08}`, `ior={1.52}`, `thickness={1.4}`, `chromaticAberration={0.03}` |
| **Frosted Acrylic** | `meshPhysicalMaterial` | `transmission={0.88}`, `roughness={0.38}`, `ior={1.49}`, `thickness={0.8}` |
| **Glossy Ceramic** | `meshPhysicalMaterial` | `color="#f8fafc"`, `metalness={0.05}`, `roughness={0.32}`, `clearcoat={0.9}`, `clearcoatRoughness={0.1}` |
| **Matte Architectural Clay** | `meshStandardMaterial` | `color="#e2e8f0"`, `metalness={0.0}`, `roughness={0.82}` |
| **HDR Emissive Core** | `meshBasicMaterial` | `color={[2.5, 0.8, 4.0]}`, `toneMapped={false}` (triggers selective `<Bloom>`) |

## Three-Point Studio Lighting Ratios

| Light Role | Intensity | Position (Relative to Subject) | Color Temperature |
| :--- | :--- | :--- | :--- |
| **Key Light** (Primary shadow caster) | `1.8 - 2.5` | `[5, 8, 5]` (45 deg horizontal, 45 deg elevation) | Warm/Neutral (`#ffffff` or `#fffbeb`) |
| **Fill Light** (Softens shadow contrast) | `0.5 - 0.9` | `[-5, 2, 3]` (Opposite key light, lower angle) | Cool Tint (`#93c5fd` or `#e0f2fe`) |
| **Rim / Back Light** (Silhouette edge) | `1.2 - 2.0` | `[0, 6, -6]` (Behind subject facing camera) | Warm or Accent (`#fde68a` or `#38bdf8`) |
| **Environment Map** (Specular reflections) | `0.8 - 1.2` | `<Environment resolution={256}>` with `<Lightformer>` strips | Required for all metallic/glossy surfaces |

## Camera Optics (`PerspectiveCamera`)

| Scene Type | Recommended FOV | Near / Far Clipping Planes | Why |
| :--- | :--- | :--- | :--- |
| **Product Showcase / Hero Object** | `35 - 42 deg` | `near: 0.1`, `far: 100` | Longer focal length eliminates wide-angle distortion and feels like a studio macro lens |
| **Scroll Storytelling Landing Page** | `40 - 48 deg` | `near: 0.1`, `far: 150` | Balanced spatial depth without edge stretching |
| **3D Action / Platformer Game** | `50 - 65 deg` | `near: 0.1`, `far: 300` | Wider peripheral awareness and stronger sense of forward speed |
