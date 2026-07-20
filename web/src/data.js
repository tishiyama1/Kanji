// Loads the kanji master data (static JSON served from /data).
const cache = {}

export async function loadGrade(grade) {
  if (cache[grade]) return cache[grade]
  const res = await fetch(`${import.meta.env.BASE_URL}data/grade-${grade}.json`)
  if (!res.ok) throw new Error(`grade ${grade} データが よみこめませんでした`)
  const json = await res.json()
  cache[grade] = json.kanji
  return json.kanji
}

export function illustUrl(char) {
  return `${import.meta.env.BASE_URL}illustrations/${encodeURIComponent(char)}.svg`
}

// The reading shown to the child as the question prompt (first kun/hiragana reading).
export function promptReading(entry) {
  return entry.yomi[0]
}

// Example-word variants for a kanji, as [text, reading] pairs. A kanji can
// carry several (`words`) so different readings get practised; older data
// with a single `word` falls back to one variant.
export function wordVariants(entry) {
  if (entry.words && entry.words.length) return entry.words
  if (entry.word) return [[entry.word, entry.yomi[0]]]
  return null
}
export function pickVariant(entry) {
  const v = wordVariants(entry)
  if (!v) return { word: null, read: promptReading(entry) }
  const [word, read] = v[Math.floor(Math.random() * v.length)]
  return { word, read }
}

// KanjiVG reference strokes (normalized 0..1), used by the handwriting scorer.
const strokeCache = {}
export async function loadStrokes(grade) {
  if (strokeCache[grade]) return strokeCache[grade]
  const res = await fetch(`${import.meta.env.BASE_URL}data/strokes-grade-${grade}.json`)
  const json = res.ok ? await res.json() : {}
  strokeCache[grade] = json
  return json
}
