// Level (rank) and badge rules — computed purely from progress data,
// so no backend change is needed.

export const RANKS = [
  { min: 0, name: 'たまご', emoji: '🥚' },
  { min: 5, name: 'ひよこ', emoji: '🐣' },
  { min: 15, name: 'ことり', emoji: '🐤' },
  { min: 30, name: 'こねこ', emoji: '🐱' },
  { min: 60, name: 'こぎつね', emoji: '🦊' },
  { min: 100, name: 'ふくろうはかせ', emoji: '🦉' },
  { min: 200, name: 'ドラゴン', emoji: '🐲' },
  { min: 400, name: 'でんせつ', emoji: '🌈' },
]

// progress: { [char]: { attempts, corrects } }
export function computeStats(progress) {
  const entries = Object.values(progress || {})
  const stars = entries.reduce((a, p) => a + (p.corrects || 0), 0)
  const attempts = entries.reduce((a, p) => a + (p.attempts || 0), 0)
  const discovered = entries.filter((p) => (p.corrects || 0) > 0).length
  const mastered = entries.filter((p) => (p.corrects || 0) >= 3).length
  return { stars, attempts, discovered, mastered }
}

export function rankFor(stars) {
  let cur = RANKS[0]
  for (const r of RANKS) if (stars >= r.min) cur = r
  return cur
}

export function nextRank(stars) {
  return RANKS.find((r) => r.min > stars) || null
}

export const BADGES = [
  { id: 'first', emoji: '⭐', name: 'はじめての せいかい', test: (s) => s.stars >= 1 },
  { id: 'star30', emoji: '🌟', name: 'ほし 30こ', test: (s) => s.stars >= 30 },
  { id: 'star100', emoji: '💫', name: 'ほし 100こ', test: (s) => s.stars >= 100 },
  { id: 'found10', emoji: '🔎', name: '10じ はっけん', test: (s) => s.discovered >= 10 },
  { id: 'found50', emoji: '📚', name: '50じ はっけん', test: (s) => s.discovered >= 50 },
  { id: 'master5', emoji: '👑', name: '5じ マスター', test: (s) => s.mastered >= 5 },
  { id: 'master20', emoji: '🏆', name: '20じ マスター', test: (s) => s.mastered >= 20 },
  { id: 'try100', emoji: '💪', name: '100かい ちょうせん', test: (s) => s.attempts >= 100 },
]
