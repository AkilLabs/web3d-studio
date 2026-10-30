---
name: 3d-scroll-choreography
description: Build fluid, Apple-style scroll-driven 3D landing pages and product showcases in Three.js and React Three Fiber. Use when choreographing camera paths along splines, synchronizing HTML typography sections with 3D objects, or building scroll-scrubbed 3D animations.
---
# 3d-scroll-choreography

Build scroll-driven 3D web experiences where the scrollbar acts as a continuous, interruptible physical timeline.

## Decision Order for Scroll 3D Scenes

Make these decisions in order before writing scene code:

1. **Choose the scroll container model**:
   - **Virtual WebGL scroll (`<ScrollControls pages={N} damping={0.15}>`)**: Best when the 3D stage owns the full viewport and HTML copy floats in `<Scroll html>`.
   - **Native DOM scroll + fixed `<Canvas>`**: Best when Next.js routing, SEO, or long editorial copy owns the page flow. Read normalized scroll progress into a mutable ref and damp toward it inside `useFrame`.
2. **Divide the timeline into section windows**:
   - Use `scroll.range(start, distance)` for directional transitions (`0 -> 1`).
   - Use `scroll.curve(start, distance)` for bell-curve emphasis (`0 -> 1 -> 0`) where an object or light peaks mid-section.
3. **Separate scroll transforms from pointer parallax**:
   - Drive the outer `<group>` with scroll progress (`lambda: 4` to `5`).
   - Drive the inner `<group>` with pointer coordinates (`state.pointer.x`, `state.pointer.y`, `lambda: 6` to `8`).
4. **Counter-balance HTML text placement**:
   - When HTML copy is left-aligned, shift the 3D hero object's target X to `+1.3` to `+1.6` world units on desktop (`viewport.width > 5`), and center it (`x = 0`) on mobile.
5. **Respect `prefers-reduced-motion: reduce`**:
   - Replace sweeping camera fly-throughs and continuous orbital spin with static framed compositions and gentle opacity/scale cross-fades.
