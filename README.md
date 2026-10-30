# Skills for 3D Web Designers and Engineers

For designers and engineers building interactive 3D websites, scroll-driven landing pages, product configurators, and 3D browser games with **Three.js** and **React Three Fiber (React / Next.js)**.

Knowing whether you made the right choice when it comes to 3D camera choreography, damping curves, PBR materials, studio lighting, or physics loops is hard. Most AI-generated 3D scenes fail in predictable ways: frame-dependent `lerp` math that breaks on 120Hz displays, harsh single-light plastic materials without environment maps, React `setState` calls inside `useFrame` that stall the main thread, and floaty physics controllers.

These skills encode concrete, opinionated 3D design engineering decisions so AI coding agents produce 3D web experiences that feel tactile, physically grounded, and locked at 60 to 120fps.

## Reference

| Skill | Main Role | When to Use |
| :--- | :--- | :--- |
| **[`3d-web-design`](skills/3d-web-design/SKILL.md)** | The core multi-directory skill for 3D web architecture, fluid motion, lighting, and performance (includes `references/`, `assets/`, and `scripts/`). | Building, refactoring, or optimizing any Three.js or React Three Fiber project. |
| **[`review-3d-scene`](skills/review-3d-scene/SKILL.md)** | Strict code reviewer that audits 3D scenes against 12 non-negotiable standards (`STANDARDS.md`) and outputs a `Before \| After \| Why` table with a `BLOCK` or `APPROVE` verdict. | Reviewing written Three.js / R3F diffs or auditing an existing 3D codebase before shipping. |
| **[`3d-scroll-choreography`](skills/3d-scroll-choreography/SKILL.md)** | Builds scroll-driven 3D landing pages, `CatmullRomCurve3` camera rigs, velocity handoff, and HTML-to-WebGL layout choreography. | Creating Apple-style scroll storytelling pages, product showcases, or camera fly-throughs. |
| **[`3d-physics-game`](skills/3d-physics-game/SKILL.md)** | Engineers 3D browser games with `@react-three/rapier` and `cannon-es`, damped character controllers, coyote-time jumping, kinematic obstacles, and instancing. | Building playable 3D web games, character controllers, vehicle mechanics, or physics sandboxes. |
| **[`3d-vocabulary`](skills/3d-vocabulary/SKILL.md)** | Reverse-lookup glossary that translates vague visual or motion descriptions into exact Three.js, R3F, GLSL, and physics terms. | When you know how an effect looks or feels ("the rainbow glass edge", "soft floor shadow") and want the exact technical term to prompt an agent. |

## Root Cheatsheets

- **[`3d-performance-cheatsheet.md`](3d-performance-cheatsheet.md)** - Frame budgets, draw call ceilings, DPR clamping, instancing, and memory disposal rules for 60-120fps WebGL.
- **[`3d-materials-lighting-cheatsheet.md`](3d-materials-lighting-cheatsheet.md)** - Verified PBR material parameters, procedural studio lighting ratios, and post-processing thresholds.

## Repository Structure

```text
3d-web-skills/
├── README.md
├── LICENSE
├── 3d-performance-cheatsheet.md
├── 3d-materials-lighting-cheatsheet.md
└── skills/
    ├── 3d-web-design/
    │   ├── SKILL.md
    │   ├── references/
    │   │   ├── STANDARDS.md
    │   │   ├── SCROLL_AND_CAMERA_CHOREOGRAPHY.md
    │   │   ├── PHYSICS_AND_GAMES.md
    │   │   └── SHADERS_LIGHTING_POSTPROCESSING.md
    │   ├── assets/
    │   │   ├── r3f-scroll-landing-template.tsx
    │   │   ├── r3f-rapier-game-template.tsx
    │   │   └── vanilla-three-starter.html
    │   └── scripts/
    │       ├── audit_3d_code.mjs
    │       └── audit_3d_code.py
    ├── review-3d-scene/
    │   ├── SKILL.md
    │   └── STANDARDS.md
    ├── 3d-scroll-choreography/
    │   └── SKILL.md
    ├── 3d-physics-game/
    │   └── SKILL.md
    └── 3d-vocabulary/
        └── SKILL.md
```

## Installation

### 1. Using Skills CLI (`npx skills`)

```bash
# Install all skills from your repository
npx skills add <your-github-username>/3d-web-skills

# Or install a specific skill
npx skills add <your-github-username>/3d-web-skills --skill 3d-web-design
npx skills add <your-github-username>/3d-web-skills --skill review-3d-scene
```

### 2. Claude Code

Clone the repository and copy the `skills/` folders into your personal or project `.claude/skills/` directory:

```bash
git clone https://github.com/<your-github-username>/3d-web-skills.git
mkdir -p ~/.claude/skills
cp -r 3d-web-skills/skills/* ~/.claude/skills/
```

### 3. Cursor / Windsurf / Codex

Copy any skill folder (for example, `skills/3d-web-design`) into `.cursor/skills/` or `.codex/skills/` inside your workspace:

```bash
mkdir -p .cursor/skills
cp -r 3d-web-skills/skills/3d-web-design .cursor/skills/
```

### 4. Running the Deterministic 3D Code Auditor

You can run the bundled static analysis script directly against any Three.js or React Three Fiber directory using either Node.js or Python:

```bash
# Node.js (recommended for JavaScript / TypeScript projects)
node skills/3d-web-design/scripts/audit_3d_code.mjs ./src

# Or Python 3
python3 skills/3d-web-design/scripts/audit_3d_code.py ./src
```

## License

MIT
