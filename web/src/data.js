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
