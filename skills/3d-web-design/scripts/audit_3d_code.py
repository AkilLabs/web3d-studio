#!/usr/bin/env python3
"""Static audit script for Three.js and React Three Fiber (R3F) codebases.

Scans .tsx, .ts, .jsx, .js, and .html files against the 3d-web-design standards
and outputs a Before | After | Why findings table and a final APPROVE / BLOCK verdict.
"""

import pathlib
import re
import sys
from typing import List, Tuple

Finding = Tuple[str, int, str, str, str, str]  # (file, line, std, before, after, why)

ALLOCATION_RE = re.compile(
    r"new\s+THREE\.(Vector[234]|Quaternion|Euler|Matrix[34]|Color|Raycaster|Box3|Sphere)\s*\("
)
RAW_LERP_RE = re.compile(r"\+=\s*\([^)]*-\s*[^)]*\)\s*\*\s*0\.\d+")
LERP_FIXED_RE = re.compile(r"\.lerp\(\s*[^,]+,\s*0\.\d+\s*\)")
EXTREME_ROUGHNESS_RE = re.compile(r"roughness\s*[:=]\s*\{?\s*(0(\.0+)?|1(\.0+)?)\s*\}?(?:[\s,>}])")


def extract_loop_blocks(lines: List[str]) -> List[Tuple[int, int]]:
    """Locate approximate line ranges of useFrame or requestAnimationFrame loops."""
    ranges: List[Tuple[int, int]] = []
    for idx, line in enumerate(lines):
        if "useFrame(" in line or "useFrame (" in line or "function animate(" in line:
            brace_depth = 0
            started = False
            for j in range(idx, min(len(lines), idx + 200)):
                for ch in lines[j]:
                    if ch == "{":
                        brace_depth += 1
                        started = True
                    elif ch == "}":
                        brace_depth -= 1
                if started and brace_depth <= 0:
                    ranges.append((idx, j))
                    break
    return ranges


def in_ranges(line_idx: int, ranges: List[Tuple[int, int]]) -> bool:
    return any(start <= line_idx <= end for start, end in ranges)


def audit_file(path: pathlib.Path) -> List[Finding]:
    findings: List[Finding] = []
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return findings

    lines = text.splitlines()
    loop_ranges = extract_loop_blocks(lines)

    has_canvas = "<Canvas" in text
    has_dpr_prop = "dpr=" in text or "setPixelRatio" in text
    if has_canvas and not has_dpr_prop:
        for idx, line in enumerate(lines):
            if "<Canvas" in line:
                findings.append((
                    path.name,
                    idx + 1,
                    "Standard #4 (DPR Clamp)",
                    line.strip(),
                    "<Canvas dpr={[1, 2]} ...>",
                    "Unbounded DPR overloads fragment shaders on 3x-4x mobile displays",
                ))
                break

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue

        # Check allocations and React state inside render loops
        if in_ranges(idx, loop_ranges):
            if ALLOCATION_RE.search(line):
                findings.append((
                    path.name,
                    idx + 1,
                    "Standard #3 (Zero Loop Allocations)",
                    stripped,
                    "Hoist `const scratch = new THREE.Vector3()` to module scope",
                    "Allocating objects inside useFrame/animate triggers GC frame spikes",
                ))
            if re.search(r"(?<![.\?])\bset[A-Z][a-zA-Z0-9_]*\s*\(", line):
                findings.append((
                    path.name,
                    idx + 1,
                    "Standard #2 (No React State in Loop)",
                    stripped,
                    "Mutate Three.js ref directly inside useFrame",
                    "Calling React setState at 60-120fps stalls reconciliation",
                ))

        # Check frame-dependent lerp
        if RAW_LERP_RE.search(line) or LERP_FIXED_RE.search(line):
            findings.append((
                path.name,
                idx + 1,
                "Standard #1 (Delta Damping)",
                stripped,
                "THREE.MathUtils.damp(cur, target, lambda, delta) or 1 - Math.exp(-lambda * delta)",
                "Fixed-factor lerp runs 2x faster on 120Hz displays than 60Hz",
            ))

        # Check extreme 0.0 or 1.0 PBR roughness
        if EXTREME_ROUGHNESS_RE.search(line):
            findings.append((
                path.name,
                idx + 1,
                "Standard #7 (Physical Roughness Bounds)",
                stripped,
                "roughness={0.12} (polished) or roughness={0.78} (matte)",
                "Pure 0.0 or 1.0 roughness looks artificial under PBR lighting",
            ))

    return findings


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 audit_3d_code.py <file-or-directory>")
        return 1

    target = pathlib.Path(sys.argv[1])
    exts = {".tsx", ".ts", ".jsx", ".js", ".html"}
    files = [target] if target.is_file() else [p for p in target.rglob("*") if p.suffix in exts]

    all_findings: List[Finding] = []
    for f in sorted(files):
        all_findings.extend(audit_file(f))

    if not all_findings:
        print("### Part 1 - Findings Table\n")
        print("No violations found across scanned 3D files.\n")
        print("### Part 2 - Verdict: APPROVE")
        return 0

    print("### Part 1 - Findings Table\n")
    print("| File:Line | Standard | Before | After | Why |")
    print("| --- | --- | --- | --- | --- |")
    for fname, line_no, std, before, after, why in all_findings:
        safe_before = before.replace("|", "\\|")
        safe_after = after.replace("|", "\\|")
        print(f"| `{fname}:{line_no}` | {std} | `{safe_before}` | `{safe_after}` | {why} |")

    print(f"\n### Part 2 - Verdict: BLOCK ({len(all_findings)} violation(s) found)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
