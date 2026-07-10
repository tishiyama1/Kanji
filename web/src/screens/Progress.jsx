import { useEffect, useState } from 'react'
import * as api from '../api.js'
import { loadGrade } from '../data.js'

export default function Progress({ session, go }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    async function run() {
      const progress = await api.getProgress(session).catch(() => ({}))
      const grades = [1, 2]
      const out = []
      for (const g of grades) {
        const entries = await loadGrade(g).catch(() => [])
        const learned = entries.filter((e) => progress[e.char] && progress[e.char].corrects > 0).length
        out.push({ grade: g, learned, total: entries.length })
      }
      const totalAttempts = Object.values(progress).reduce((a, p) => a + p.attempts, 0)
      const totalCorrect = Object.values(progress).reduce((a, p) => a + p.corrects, 0)
      setRows({ grades: out, totalAttempts, totalCorrect })
    }
    run()
  }, [session.userId])

  if (!rows) return <div className="card center">よみこみちゅう…</div>

  return (
    <div className="screen scrollable">
      <h1>⭐ せいせき</h1>
      <div className="card">
        <h2>{session.name} さん</h2>
        <p>ぜんぶで {rows.totalCorrect}かい せいかい（{rows.totalAttempts}かい ちょうせん）</p>
      </div>

      {rows.grades.map((r) => {
        const pct = r.total ? Math.round((r.learned / r.total) * 100) : 0
        return (
          <div className="card" key={r.grade}>
            <div className="progress-row">
              <strong>{r.grade}ねんせい</strong>
              <div className="bar"><span style={{ width: pct + '%' }} /></div>
              <span>{r.learned}／{r.total}</span>
            </div>
          </div>
        )
      })}

      <button className="ghost" onClick={() => go('home')}>もどる</button>
    </div>
  )
}
