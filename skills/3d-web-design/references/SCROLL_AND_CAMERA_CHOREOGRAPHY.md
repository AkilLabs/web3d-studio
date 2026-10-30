# Scroll & Camera Choreography Reference

Detailed engineering patterns for building scroll-driven 3D landing pages, interactive product showcases, and camera rigs in Three.js and React Three Fiber.

## 1. Scroll Architecture Patterns

Choose between two proven scroll architectures based on how HTML content interacts with the 3D canvas:

### Pattern A: Full-Viewport Canvas with Drei `<ScrollControls>`

Use when the 3D scene is the primary viewport experience and HTML sections scroll inside a virtualized container synchronized with WebGL:

- Set `<ScrollControls pages={4} damping={0.15}>` inside `<Canvas>`.
- Place 3D objects that move automatically at scroll speed inside `<Scroll>`, or keep them stationary in world space and drive their transforms via `useScroll()` inside `useFrame`.
- Place HTML overlay sections inside `<Scroll html style={{ width: '100%' }}>`, positioning each section at `100vh` intervals (`top: '0vh'`, `top: '100vh'`, `top: '200vh'`).

### Pattern B: Native Window Scroll with Fixed Background Canvas

Use when SEO, native browser scrollbar behavior, or complex Next.js DOM routing is required:

- Mount `<Canvas>` inside a `position: fixed; inset: 0; pointer-events: none; z-index: 0` container.
- Place standard HTML `<section className="min-h-screen relative z-10">` elements in the document flow.
- Track normalized scroll progress in a lightweight passive scroll listener that writes to a mutable store/ref (`scrollRef.current = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)`), and damp toward `scrollRef.current` inside `useFrame`.

## 2. Section Choreographer (`scroll.range` and `scroll.curve`)

Never drive an entire multi-section landing page with a single linear formula. Break the timeline into normalized section windows:

- `scroll.range(start, distance)`: Ramps linearly from `0` to `1` over the interval `[start, start + distance]`, clamped outside that window.
- `scroll.curve(start, distance)`: Ramps smoothly `0 -> 1 -> 0` (sine bell curve) over the interval `[start, start + distance]`. Ideal for objects or key lights that enter, peak at the center of a section, and recede as the user scrolls past.

```tsx
const rHero = scroll.range(0, 1 / 3);
const rDetails = scroll.range(1 / 3, 1 / 3);
const rFinale = scroll.range(2 / 3, 1 / 3);
const pulseMiddle = scroll.curve(1 / 3, 1 / 3);
```

## 3. Spline Camera Rigs (`CatmullRomCurve3`)

When guiding the user through a 3D environment along a curved path, avoid interpolating raw Euler angles (which suffer from gimbal lock and unnatural arcs). Instead, sample a `THREE.CatmullRomCurve3` for both camera position and look-at target:

```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';

const sampledPos = new THREE.Vector3();
const sampledLookAt = new THREE.Vector3();

export function SplineCameraRig() {
  const scroll = useScroll();
  const smoothProgress = useRef(0);
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const { positionCurve, targetCurve } = useMemo(() => {
    const positionCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 6),
      new THREE.Vector3(3.2, 2.0, 2.5),
      new THREE.Vector3(-2.5, 1.2, -1.5),
      new THREE.Vector3(0, 0.8, -5.0),
    ]);
    const targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0.5, 0.8, -1),
      new THREE.Vector3(-0.5, 0.5, -3),
      new THREE.Vector3(0, 0.5, -7),
    ]);
    return { positionCurve, targetCurve };
  }, []);

  useFrame((state, delta) => {
    smoothProgress.current = THREE.MathUtils.damp(
      smoothProgress.current,
      THREE.MathUtils.clamp(scroll.offset, 0, 1),
      4,
      delta
    );

    positionCurve.getPointAt(smoothProgress.current, sampledPos);
    targetCurve.getPointAt(smoothProgress.current, sampledLookAt);

    state.camera.position.lerp(sampledPos, 1 - Math.exp(-8 * delta));
    currentLookAt.current.lerp(sampledLookAt, 1 - Math.exp(-8 * delta));
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
}
```

## 4. Compositional Balance with HTML Overlays

When text sits on top of a 3D canvas, camera framing must adapt to the viewport layout:

- **Left-aligned text section**: Shift the 3D hero model's target X position to the right (`+1.2` to `+1.8` world units on desktop) so the model occupies the right half of the viewport.
- **Right-aligned text section**: Shift the 3D model's target X position to the left (`-1.2` to `-1.8` world units).
- **Responsive viewport scaling**: Multiply world X offsets by `Math.min(state.viewport.width / 8, 1)` and stack the 3D model above or below the text on narrow mobile viewports (`state.viewport.width < 4.5`) so text never collides with high-contrast 3D geometry.

## 5. Pointer Parallax + Scroll Composition

To combine scroll choreography with pointer parallax without one overwriting the other, separate them into nested `<group>` nodes:

- **Outer `<group ref={scrollGroupRef}>`**: Driven exclusively by scroll progress (large translations and 360-degree turns, `lambda: 4`).
- **Inner `<group ref={parallaxGroupRef}>`**: Driven exclusively by pointer offset (`state.pointer.x * 0.25`, `state.pointer.y * 0.18`, `lambda: 7`).
