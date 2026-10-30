#!/usr/bin/env node

/**
 * Static audit script for Three.js and React Three Fiber (R3F) codebases.
 * Scans .tsx, .ts, .jsx, .js, and .html files against the 3d-web-design standards
 * and outputs a Before | After | Why findings table and a final APPROVE / BLOCK verdict.
 */

import fs from 'node:fs';
import path from 'node:path';

const ALLOCATION_RE = /new\s+(?:THREE\.(Vector[234]|Quaternion|Euler|Matrix[34]|Color|Raycaster|Box3|Sphere)|(?:rapier\.)?Ray|Array|Object)\s*\(/;
const RAW_LERP_RE = /\+=\s*\([^)]*-\s*[^)]*\)\s*\*\s*0\.\d+/;
const LERP_FIXED_RE = /\.lerp\(\s*[^,]+,\s*0\.\d+\s*\)/;
const EXTREME_ROUGHNESS_RE = /roughness\s*[:=]\s*\{?\s*(0(\.0+)?|1(\.0+)?)\s*\}?(?:[\s,>}])/;
const REACT_STATE_RE = /(?<![.\?])\bset[A-Z][a-zA-Z0-9_]*\s*\(/;

function extractLoopBlocks(lines) {
  const ranges = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes('useFrame(') || line.includes('useFrame (') || line.includes('function animate(') || line.includes('const animate =')) {
      let braceDepth = 0;
      let started = false;
      const maxScan = Math.min(lines.length, idx + 250);
      for (let j = idx; j < maxScan; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') {
            braceDepth++;
            started = true;
          } else if (ch === '}') {
            braceDepth--;
          }
        }
        if (started && braceDepth <= 0) {
          ranges.push([idx, j]);
          break;
        }
      }
    }
  }
  return ranges;
}

function inRanges(lineIdx, ranges) {
  return ranges.some(([start, end]) => lineIdx >= start && lineIdx <= end);
}

function auditFile(filePath) {
  const findings = [];
  let text = '';
  try {
    text = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return findings;
  }

  const lines = text.split(/\r?\n/);
  const loopRanges = extractLoopBlocks(lines);
  const fileName = path.basename(filePath);

  const hasCanvas = text.includes('<Canvas');
  const hasDprProp = text.includes('dpr=') || text.includes('setPixelRatio');
  if (hasCanvas && !hasDprProp) {
    for (let idx = 0; idx < lines.length; idx++) {
      if (lines[idx].includes('<Canvas')) {
        findings.push({
          file: fileName,
          line: idx + 1,
          std: 'Standard #4 (DPR Clamp)',
          before: lines[idx].trim(),
          after: '<Canvas dpr={[1, 2]} ...>',
          why: 'Unbounded DPR overloads fragment shaders on 3x-4x mobile displays'
        });
        break;
      }
    }
  }

  // Check for unbounded window.devicePixelRatio in vanilla Three.js
  if (text.includes('setPixelRatio(window.devicePixelRatio)') && !text.includes('Math.min')) {
    for (let idx = 0; idx < lines.length; idx++) {
      if (lines[idx].includes('setPixelRatio(window.devicePixelRatio)')) {
        findings.push({
          file: fileName,
          line: idx + 1,
          std: 'Standard #4 (DPR Clamp)',
          before: lines[idx].trim(),
          after: 'renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))',
          why: 'Unbounded DPR overloads fragment shaders on 3x-4x mobile displays'
        });
        break;
      }
    }
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const stripped = rawLine.trim();

    if (stripped.startsWith('//') || stripped.startsWith('*') || stripped.startsWith('/*')) {
      continue;
    }

    // Check allocations and React state inside render loops
    if (inRanges(idx, loopRanges)) {
      if (ALLOCATION_RE.test(rawLine)) {
        findings.push({
          file: fileName,
          line: idx + 1,
          std: 'Standard #3 (Zero Loop Allocations)',
          before: stripped,
          after: 'Hoist scratch instances outside the component or loop scope',
          why: 'Allocating objects inside useFrame/animate triggers GC frame spikes'
        });
      }

      if (REACT_STATE_RE.test(rawLine)) {
        findings.push({
          file: fileName,
          line: idx + 1,
          std: 'Standard #2 (No React State in Loop)',
          before: stripped,
          after: 'Mutate Three.js ref directly inside useFrame',
          why: 'Calling React setState at 60-120fps stalls reconciliation'
        });
      }
    }

    // Check frame-dependent lerp
    if (RAW_LERP_RE.test(rawLine) || LERP_FIXED_RE.test(rawLine)) {
      findings.push({
        file: fileName,
        line: idx + 1,
        std: 'Standard #1 (Delta Damping)',
        before: stripped,
        after: 'THREE.MathUtils.damp(cur, target, lambda, delta) or 1 - Math.exp(-lambda * delta)',
        why: 'Fixed-factor lerp runs 2x faster on 120Hz displays than 60Hz'
      });
    }

    // Check extreme roughness
    if (EXTREME_ROUGHNESS_RE.test(rawLine)) {
      findings.push({
        file: fileName,
        line: idx + 1,
        std: 'Standard #7 (Physical Roughness Bounds)',
        before: stripped,
        after: 'roughness={0.12} (polished) or roughness={0.78} (matte)',
        why: 'Pure 0.0 or 1.0 roughness looks artificial under PBR lighting'
      });
    }
  }

  return findings;
}

function collectFiles(targetPath, exts) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return exts.has(path.extname(targetPath).toLowerCase()) ? [targetPath] : [];
  }

  const results = [];
  const entries = fs.readdirSync(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, exts));
    } else if (entry.isFile() && exts.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node audit_3d_code.mjs <file-or-directory>');
    process.exit(1);
  }

  const target = path.resolve(args[0]);
  if (!fs.existsSync(target)) {
    console.error(`Target not found: ${target}`);
    process.exit(1);
  }

  const exts = new Set(['.tsx', '.ts', '.jsx', '.js', '.html']);
  const files = collectFiles(target, exts).sort();

  const allFindings = [];
  for (const f of files) {
    allFindings.push(...auditFile(f));
  }

  if (allFindings.length === 0) {
    console.log('### Part 1 - Findings Table\n');
    console.log('No violations found across scanned 3D files.\n');
    console.log('### Part 2 - Verdict: APPROVE');
    process.exit(0);
  }

  console.log('### Part 1 - Findings Table\n');
  console.log('| File:Line | Standard | Before | After | Why |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const f of allFindings) {
    const safeBefore = f.before.replaceAll('|', '\\|');
    const safeAfter = f.after.replaceAll('|', '\\|');
    console.log(`| \`${f.file}:${f.line}\` | ${f.std} | \`${safeBefore}\` | \`${safeAfter}\` | ${f.why} |`);
  }

  console.log(`\n### Part 2 - Verdict: BLOCK (${allFindings.length} violation(s) found)`);
  process.exit(1);
}

main();

