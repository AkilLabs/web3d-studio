# Contributing to Web3D Studio

Thank you for your interest in contributing to **Web3D Studio**!

Web3D Studio is an open-source collection of specialized AI skills designed to help AI coding agents and human engineers build production-grade, high-performance 3D web experiences with Three.js, React Three Fiber, and WebGL.

---

## 🛠️ Ways to Contribute

You can contribute in several ways:

1. **Add or refine AI Skills**: Expand the existing skills (`3d-web-design`, `review-3d-scene`, `3d-scroll-choreography`, `3d-physics-game`, `3d-vocabulary`) with more patterns, guidelines, and edge-case handling.
2. **Update Standards**: Suggest new non-negotiable standards for [`STANDARDS.md`](skills/review-3d-scene/STANDARDS.md) based on real-world production discoveries.
3. **Expand Cheatsheets**: Add verified PBR material parameters, lighting setups, or frame-budget benchmarks to [`3d-materials-lighting-cheatsheet.md`](3d-materials-lighting-cheatsheet.md) or [`3d-performance-cheatsheet.md`](3d-performance-cheatsheet.md).
4. **Improve the Code Auditor**: Add regex / AST rules to `audit_3d_code.mjs` and `audit_3d_code.py` to catch more performance anti-patterns automatically.
5. **Add Production Templates**: Submit tested, high-performance starter templates in `skills/3d-web-design/assets/`.

---

## 📋 Standards & Guidelines

All contributions must adhere to the core Web3D Studio engineering principles:

- **Frame-rate independence**: Never use unscaled `lerp(a, b, alpha)` inside render loops. Always damp with delta time (`THREE.MathUtils.damp` or `maath/damping`).
- **Memory safety**: Explicitly dispose of unused geometries, materials, textures, and render targets upon unmount.
- **Render performance**: Maintain target budgets (16.6ms for 60fps, 8.3ms for 120fps), clamp DPR to `Math.min(window.devicePixelRatio, 2)`, and keep draw calls below budget (< 50 mobile, < 100 desktop).
- **Physical grounding**: Ensure materials utilize roughness, metalness, and environment map reflections rather than flat plastic defaults.

---

## 🚀 Submitting a Pull Request

1. **Fork the repository** on GitHub: `https://github.com/AkilLabs/web3d-studio`.
2. **Create a topic branch**: `git checkout -b feature/my-new-skill-or-fix`.
3. **Run the auditor** if adding templates or code:
   ```bash
   node skills/3d-web-design/scripts/audit_3d_code.mjs ./skills/3d-web-design/assets
   ```
4. **Commit your changes**: Write clear, descriptive commit messages.
5. **Open a Pull Request**: Explain the rationale, provide before/after examples if relevant, and reference any open issues.

---

## 📄 License

By contributing to Web3D Studio, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

