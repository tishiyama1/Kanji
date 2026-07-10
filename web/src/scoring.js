// In-browser handwriting scorer.
// Compares the child's drawn strokes against KanjiVG reference strokes.
// Runs entirely on-device (no network, no cost). Signals combined:
//   - shape overlap (how much the ink shapes match)
//   - stroke count (画数 correct?)
//   - stroke direction (筆順/向き, only when counts match)
//
// Thresholds are intentionally lenient (kids) and easy to tune here.
const GRID = 28
const DILATE = 1
const TH = { perfect: 0.72, ok: 0.55, close: 0.38 } // combined-score cutoffs

// Normalize a set of strokes into the unit square, preserving aspect ratio.
function normalize(strokes) {
  const pts = strokes.flat()
  if (pts.length === 0) return strokes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); minY = Math.min(minY, y)
    maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  const w = maxX - minX, h = maxY - minY
  const scale = 1 / (Math.max(w, h) || 1)
  const offX = (1 - w * scale) / 2
  const offY = (1 - h * scale) / 2
  return strokes.map((s) => s.map(([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY]))
}

// Rasterize strokes into a dilated boolean grid; returns a Set of cell indices.
function raster(strokes) {
  const cells = new Set()
  const mark = (gx, gy) => {
    for (let dx = -DILATE; dx <= DILATE; dx++)
      for (let dy = -DILATE; dy <= DILATE; dy++) {
        const x = gx + dx, y = gy + dy
        if (x >= 0 && x < GRID && y >= 0 && y < GRID) cells.add(y * GRID + x)
      }
  }
  for (const s of strokes) {
    for (let i = 1; i < s.length; i++) {
      const [x0, y0] = s[i - 1], [x1, y1] = s[i]
      const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * GRID))
      for (let t = 0; t <= steps; t++) {
        const gx = Math.round((x0 + (x1 - x0) * (t / steps)) * (GRID - 1))
        const gy = Math.round((y0 + (y1 - y0) * (t / steps)) * (GRID - 1))
        mark(gx, gy)
      }
    }
  }
  return cells
}

function dice(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const c of a) if (b.has(c)) inter++
  return (2 * inter) / (a.size + b.size)
}

function dirScore(da, db) {
  // average cosine similarity of each stroke's overall direction
  const vec = (s) => [s[s.length - 1][0] - s[0][0], s[s.length - 1][1] - s[0][1]]
  let sum = 0
  for (let i = 0; i < da.length; i++) {
    const [ax, ay] = vec(da[i]), [bx, by] = vec(db[i])
    const na = Math.hypot(ax, ay) || 1, nb = Math.hypot(bx, by) || 1
    const cos = (ax * bx + ay * by) / (na * nb)
    sum += Math.max(0, cos)
  }
  return sum / da.length
}

// drawn: strokes in canvas pixels; reference: strokes normalized 0..1
export function scoreHandwriting(drawn, reference) {
  if (!drawn || drawn.length === 0 || !reference || reference.length === 0) {
    return { grade: 'retry', correct: false, score: 0, strokeDiff: reference?.length ?? 0 }
  }
  const A = normalize(drawn)
  const B = normalize(reference)
  const shape = dice(raster(A), raster(B))
  const strokeDiff = Math.abs(A.length - B.length)
  const countScore = Math.max(0, 1 - strokeDiff * 0.5)

  let score, dir = null
  if (A.length === B.length) {
    dir = dirScore(A, B)
    score = 0.7 * shape + 0.15 * countScore + 0.15 * dir
  } else {
    score = 0.8 * shape + 0.2 * countScore
  }

  let grade
  if (score >= TH.perfect && strokeDiff === 0) grade = 'perfect'
  else if (score >= TH.ok) grade = 'ok'
  else if (score >= TH.close) grade = 'close'
  else grade = 'retry'

  return {
    grade,
    correct: grade === 'perfect' || grade === 'ok',
    score: +score.toFixed(3),
    shape: +shape.toFixed(3),
    dir: dir == null ? null : +dir.toFixed(3),
    strokeDiff,
  }
}

export const GRADE_LABEL = {
  perfect: { emoji: '💯', text: 'かんぺき！', cls: 'green' },
  ok: { emoji: '⭕', text: 'できた！', cls: 'green' },
  close: { emoji: '✨', text: 'おしい！', cls: 'yellow' },
  retry: { emoji: '💪', text: 'もういちど！', cls: 'pink' },
}
