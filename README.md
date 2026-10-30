# Web3D Studio

<p align="center">
  <strong>Make the web feel three-dimensional.</strong><br>
  A collection of specialized AI skills for building immersive, interactive, and high-performance 3D web experiences.
</p>

<p align="center">
  <a href="https://github.com/AkilLabs/web3d-studio"><img src="https://img.shields.io/badge/repository-AkilLabs%2Fweb3d--studio-blue?style=flat-square" alt="Repository"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="License"></a>
  <a href="#-supported-agents"><img src="https://img.shields.io/badge/agents-Claude%20%7C%20Cursor%20%7C%20Windsurf%20%7C%20Codex-purple?style=flat-square" alt="Supported Agents"></a>
  <a href="#-whats-inside"><img src="https://img.shields.io/badge/skills-5%20specialized%20skills-orange?style=flat-square" alt="Skills"></a>
</p>

<p align="center">
  <a href="#-whats-inside">Explore Skills</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-example-prompts">Example Prompts</a> ·
  <a href="#-supported-agents">Supported Agents</a> ·
  <a href="#-contributing">Contributing</a> ·
  <a href="https://github.com/AkilLabs/web3d-studio/issues">Report an Issue</a>
</p>

---

From cinematic scroll animations and realistic product showcases to physics-powered browser games, **Web3D Studio** helps AI coding agents build better, production-grade 3D web experiences with **Three.js**, **React Three Fiber (R3F)**, and **WebGL**.

> *Design with depth. Engineer with precision. Build without limits.*

---

## Why Web3D Studio?

Great 3D websites need more than beautiful visuals. They need carefully engineered motion, realistic materials, efficient rendering, and smooth performance.

Most AI-generated 3D scenes fail in predictable ways:
- **Frame-dependent damping**: raw `lerp` math without delta time that runs twice as fast on 120Hz ProMotion screens.
- **Harsh plastic materials**: single point lights with no environment maps, un-diffused shadows, and default specular highlights.
- **Main-thread stalls**: React `setState` calls inside `useFrame`, triggering 60 re-renders per second.
- **Floaty physics**: lacking coyote time, jump buffering, or kinematic obstacle collision handling.
- **Memory leaks**: un-disposed geometries, textures, and WebGL render targets upon unmount.

**Web3D Studio** brings these production practices into reusable AI skills, helping agents move beyond basic 3D scenes toward production-minded, 60–120fps experiences.

*Open source. Built for AI-assisted development.*

---

## ✨ What's inside?

| Skill | Role | Description | When to Use |
| :--- | :--- | :--- | :--- |
| **[`3d-web-design`](skills/3d-web-design/SKILL.md)** | **3D Web Design** | Architecture, lighting, materials, camera movement, and performance. Includes production templates and automated code auditing scripts. | Building, refactoring, or optimizing any Three.js or React Three Fiber project. |
| **[`review-3d-scene`](skills/review-3d-scene/SKILL.md)** | **3D Scene Review** | Automated standards-based review of 3D implementations. Enforces 12 strict rules (`STANDARDS.md`) with a `Before \| After \| Why` audit table and a `BLOCK` or `APPROVE` verdict. | Reviewing PRs, written 3D code diffs, or pre-flight auditing before shipping. |
| **[`3d-scroll-choreography`](skills/3d-scroll-choreography/SKILL.md)** | **Scroll Choreography** | Cinematic camera paths and scroll-driven storytelling. Smooth `CatmullRomCurve3` splines, damp3 velocity handoffs, and HTML-to-WebGL layout sync. | Creating Apple-style scroll storytelling pages, product showcases, or fly-throughs. |
| **[`3d-physics-game`](skills/3d-physics-game/SKILL.md)** | **3D Physics & Games** | Realistic physics, responsive controls, and browser game mechanics with `@react-three/rapier` and `cannon-es`. Damped character controllers, coyote-time jumping, and instancing. | Building playable 3D web games, character controllers, vehicle mechanics, or physics sandboxes. |
| **[`3d-vocabulary`](skills/3d-vocabulary/SKILL.md)** | **3D Vocabulary** | Translate visual ideas into precise technical concepts. Reverse-lookup glossary translating sensory cues ("rainbow glass edge", "soft floor shadow") into exact Three.js/GLSL parameters. | When you know how an effect should look or feel and want the exact technical terminology to prompt an AI agent. |

---

## 📚 Cheatsheets & Architecture Reference

Every skill is backed by comprehensive, battle-tested reference guides:

- **[`3d-performance-cheatsheet.md`](3d-performance-cheatsheet.md)** — Frame budgets (16.6ms / 8.3ms), draw call ceilings (< 50 mobile / < 100 desktop), triangle limits, DPR clamping, and memory disposal lifecycles.
- **[`3d-materials-lighting-cheatsheet.md`](3d-materials-lighting-cheatsheet.md)** — Verified physical PBR values (metals, glass, plastics, fabric), studio 3-point key/fill/rim lighting ratios, and post-processing thresholds.
- **[`STANDARDS.md`](skills/review-3d-scene/STANDARDS.md)** — 12 strict production rules enforced by the reviewer skill.

---

## 🤖 Supported Agents

Web3D Studio skills follow the open [Agent Skills](https://github.com/agent-skills/skills) format and seamlessly plug into any major AI development tool:

| Agent / Tool | Supported | Installation Directory |
| :--- | :---: | :--- |
| **Claude Code** | Native | `~/.claude/skills/` or project `.claude/skills/` |
| **Cursor** | Native | `.cursor/skills/` |
| **Windsurf** | Native | `.windsurf/skills/` |
| **Codex / GitHub Copilot** | Native | `.codex/skills/` |
| **Antigravity** | Native | `skills/` workspace root |

---

## ⚡ Quick Start

### 1. Using Skills CLI (`npx skills`)

The quickest way to add Web3D Studio skills to any project:

```bash
# Install all Web3D Studio skills
npx skills add AkilLabs/web3d-studio

# Or install individual skills
npx skills add AkilLabs/web3d-studio --skill 3d-web-design
npx skills add AkilLabs/web3d-studio --skill review-3d-scene
npx skills add AkilLabs/web3d-studio --skill 3d-scroll-choreography
npx skills add AkilLabs/web3d-studio --skill 3d-physics-game
npx skills add AkilLabs/web3d-studio --skill 3d-vocabulary
```

### 2. Claude Code

Clone the repository and copy the skills into your Claude skills directory:

```bash
git clone https://github.com/AkilLabs/web3d-studio.git
mkdir -p ~/.claude/skills
cp -r web3d-studio/skills/* ~/.claude/skills/
```

### 3. Cursor / Windsurf / Codex

Copy the skill folders into your workspace configuration folder:

```bash
# For Cursor
mkdir -p .cursor/skills
cp -r web3d-studio/skills/* .cursor/skills/

# For Windsurf
mkdir -p .windsurf/skills
cp -r web3d-studio/skills/* .windsurf/skills/
```

---

## 💡 Example Prompts

Once installed, your AI agent automatically picks up the appropriate skill based on context. You can also prompt with specific intent:

#### 🎬 Cinematic Scroll Landing Page
> *"Build an Apple-style scroll-driven 3D product showcase for a luxury watch using React Three Fiber. Use a 5-point CatmullRom spline camera path, frame-rate independent damp3 easing, and synchronize the model rotation with pinned HTML narrative sections."*

#### 🔍 Strict Pre-flight Code Review
> *"Audit this React Three Fiber scene against the 12 Web3D Studio standards. Check for useFrame state triggers, un-memoized geometries, missing texture disposal, and uncapped DPR. Format the findings in a Before | After | Why table and issue a BLOCK or APPROVE verdict."*

#### 🎮 Responsive Browser Game
> *"Create a 3D platformer prototype using React Three Fiber and @react-three/rapier. Implement a kinematic character controller with coyote time, jump buffering, responsive WASD controls, and a smooth damping follow camera."*

#### 🎨 Physical Material & Studio Lighting Tuning
> *"I want frosted fluted glass with chromatic dispersion on the rim and soft directional studio lighting. Translate this aesthetic into exact MeshPhysicalMaterial properties and 3-point studio light intensities."*

---

## 🛠️ Deterministic 3D Code Auditor

Web3D Studio includes automated static analysis scripts that detect performance anti-patterns and memory leaks before you ship:

```bash
# Node.js (recommended for JavaScript / TypeScript projects)
node skills/3d-web-design/scripts/audit_3d_code.mjs ./src

# Or Python 3
python3 skills/3d-web-design/scripts/audit_3d_code.py ./src
```

**What it flags:**
- ❌ React `setState` calls inside `useFrame` (main-thread stalls)
- ❌ Missing disposal hooks for geometries, materials, or textures
- ❌ Frame-dependent `lerp(a, b, 0.1)` calculations without `delta`
- ❌ Unclamped `window.devicePixelRatio` (GPU crashes on high-DPI screens)
- ❌ Oversized shadow map dimensions (> 2048px)
- ❌ Direct matrix allocations inside render loops

---

## 📁 Repository Structure

```text
web3d-studio/
├── README.md
├── CONTRIBUTING.md
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

---

## 🤝 Contributing

Contributions are welcome! Whether you're contributing new performance patterns, expanding physics mechanics, refining shaders, or improving the static auditor:

1. Check out [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and standards.
2. Open an issue to discuss proposed additions or improvements.
3. Submit a pull request with clear tests or documentation updates.

---

## 🎨 Social Preview & Brand Guidelines

When sharing or creating repository social previews for **Web3D Studio**:
- **Design Theme**: Dark, minimal aesthetic (`#0A0A0E` background) with a floating geometric 3D wireframe / glass object.
- **Title**: `Web3D Studio`
- **Tagline**: `Make the web feel three-dimensional.` or `Build beyond the browser.`
- **Positioning**: Reusable AI skill collection for production-grade 3D web development.

---

## 📜 License

[MIT](LICENSE) © 2026 [AkilLabs](https://github.com/AkilLabs)
