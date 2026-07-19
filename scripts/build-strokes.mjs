// Fetches KanjiVG stroke data for the writeable (hasIllust) kanji of a grade
// and produces a compact reference file of resampled, normalized stroke points.
//
// Usage: node scripts/build-strokes.mjs 1 2
//
// Output: web/public/data/strokes-grade-<N>.json
//   { "山": [ [[x,y],...16], ... perStroke ], ... }  (coords normalized 0..1)
//
// KanjiVG data: © Ulrich Apel / KanjiVG, CC BY-SA 3.0 (http://kanjivg.tagaini.net)
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SAMPLES = 16 // points per stroke
const RAW = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji'

// --- minimal SVG path -> dense polyline ---
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ]
}
function quad(p0, p1, p2, t) {
  const u = 1 - t
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ]
}

function flatten(d) {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || []
  let i = 0
  const num = () => parseFloat(toks[i++])
  const pts = []
  let cur = [0, 0]
  let start = [0, 0]
  let prevCtrl = null
  let cmd = ''
  const push = (p) => pts.push(p)
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++]
    const rel = cmd === cmd.toLowerCase()
    const base = rel ? cur : [0, 0]
    switch (cmd.toUpperCase()) {
      case 'M': {
        cur = [base[0] + num(), base[1] + num()]; start = cur; push(cur); prevCtrl = null
        cmd = rel ? 'l' : 'L'; break
      }
      case 'L': { cur = [base[0] + num(), base[1] + num()]; push(cur); prevCtrl = null; break }
      case 'H': { cur = [base[0] + num(), cur[1]]; push(cur); prevCtrl = null; break }
      case 'V': { cur = [cur[0], base[1] + num()]; push(cur); prevCtrl = null; break }
      case 'C': {
        const c1 = [base[0] + num(), base[1] + num()]
        const c2 = [base[0] + num(), base[1] + num()]
        const e = [base[0] + num(), base[1] + num()]
        for (let t = 1; t <= 8; t++) push(cubic(cur, c1, c2, e, t / 8))
        prevCtrl = c2; cur = e; break
      }
      case 'S': {
        const c1 = prevCtrl ? [2 * cur[0] - prevCtrl[0], 2 * cur[1] - prevCtrl[1]] : cur
        const c2 = [base[0] + num(), base[1] + num()]
        const e = [base[0] + num(), base[1] + num()]
        for (let t = 1; t <= 8; t++) push(cubic(cur, c1, c2, e, t / 8))
        prevCtrl = c2; cur = e; break
      }
      case 'Q': {
        const c1 = [base[0] + num(), base[1] + num()]
        const e = [base[0] + num(), base[1] + num()]
        for (let t = 1; t <= 8; t++) push(quad(cur, c1, e, t / 8))
        prevCtrl = c1; cur = e; break
      }
      case 'T': {
        const c1 = prevCtrl ? [2 * cur[0] - prevCtrl[0], 2 * cur[1] - prevCtrl[1]] : cur
        const e = [base[0] + num(), base[1] + num()]
        for (let t = 1; t <= 8; t++) push(quad(cur, c1, e, t / 8))
        prevCtrl = c1; cur = e; break
      }
      case 'Z': { cur = start; push(cur); prevCtrl = null; break }
      default: i++ // skip unknown
    }
  }
  return pts
}

// resample polyline to n points by arc length
function resample(poly, n) {
  if (poly.length === 0) return []
  const d = [0]
  for (let k = 1; k < poly.length; k++) {
    const dx = poly[k][0] - poly[k - 1][0], dy = poly[k][1] - poly[k - 1][1]
    d.push(d[k - 1] + Math.hypot(dx, dy))
  }
  const total = d[d.length - 1] || 1
  const out = []
  for (let s = 0; s < n; s++) {
    const target = (total * s) / (n - 1)
    let k = 1
    while (k < d.length && d[k] < target) k++
    const k0 = k - 1, k1 = Math.min(k, poly.length - 1)
    const seg = d[k1] - d[k0] || 1
    const f = (target - d[k0]) / seg
    out.push([
      poly[k0][0] + (poly[k1][0] - poly[k0][0]) * f,
      poly[k0][1] + (poly[k1][1] - poly[k0][1]) * f,
    ])
  }
  return out
}

function strokesFor(char) {
  const hex = char.codePointAt(0).toString(16).padStart(5, '0')
  const svg = execSync(`curl -sS "${RAW}/${hex}.svg"`, { encoding: 'utf8', maxBuffer: 4e6 })
  const ds = [...svg.matchAll(/\sd="(M[^"]*)"/g)].map((m) => m[1])
  return ds.map((d) => resample(flatten(d), SAMPLES).map((p) => [
    +(p[0] / 109).toFixed(3), +(p[1] / 109).toFixed(3),
  ]))
}

const grades = process.argv.slice(2).map(Number)
if (grades.length === 0) { console.error('usage: node build-strokes.mjs <grade...>'); process.exit(1) }

for (const g of grades) {
  const master = JSON.parse(readFileSync(join(ROOT, `web/public/data/grade-${g}.json`), 'utf8'))
  // every quizzable kanji (has an example word) needs reference strokes
  const targets = master.kanji.filter((e) => e.word)
  const out = {}
  for (const e of targets) {
    process.stdout.write(`grade ${g}: ${e.char} … `)
    out[e.char] = strokesFor(e.char)
    console.log(`${out[e.char].length} strokes`)
  }
  const dest = join(ROOT, `web/public/data/strokes-grade-${g}.json`)
  writeFileSync(dest, JSON.stringify(out))
  console.log(`wrote ${dest}`)
}
