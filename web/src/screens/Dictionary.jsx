import { useEffect, useState } from 'react'
import * as api from '../api.js'
import { loadGrade } from '../data.js'

export default function Dictionary({ session, grade, go }) {
  const [entries, setEntries] = useState(null)
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadGrade(grade).then(setEntries)
    api.getProgress(session).then(setProgress).catch(() => setProgress({}))
  }, [grade, session])

  if (!entries) return <div className="card center">よみこみちゅう…</div>

  const filtered = entries.filter((e) =>
    !query || e.char.includes(query) || e.yomi.some((y) => y.includes(query))
  )

  return (
    <div>
      <h1>📖 かんじ じてん</h1>
      <div className="card">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="かんじ か よみ で さがす" />
      </div>

      {filtered.map((e) => {
        const p = progress[e.char]
        const isOpen = open === e.char
        return (
          <div className="card" key={e.char}>
            <div className="dict-item" onClick={() => setOpen(isOpen ? null : e.char)}>
              <div className="k">{e.char}</div>
              <div className="meta">
                <div className="yomi">{e.yomi.join('・')}</div>
                <div>{e.meaning}</div>
              </div>
              <div className="badge">せいかい {p ? p.corrects : 0}かい</div>
            </div>
            {isOpen && (
              <div style={{ marginTop: 12 }}>
                <p>かくすう：{e.strokes}かく</p>
                <p>ちょうせん：{p ? p.attempts : 0}かい / せいかい：{p ? p.corrects : 0}かい</p>
                <p>れいぶん：</p>
                <ul>{e.examples.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
              </div>
            )}
          </div>
        )
      })}

      <button className="ghost" onClick={() => go('home')}>もどる</button>
    </div>
  )
}
