import { useEffect, useState } from 'react'
import * as api from '../api.js'
import { loadGrade } from '../data.js'
import Mascot from '../components/Mascot.jsx'
import { computeStats, rankFor, nextRank, BADGES } from '../level.js'

export default function Progress({ session, go }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    async function run() {
      const progress = await api.getProgress(session).catch(() => ({}))
      const grades = [1, 2, 3]
      const out = []
      for (const g of grades) {
        const entries = await loadGrade(g).catch(() => [])
        const learned = entries.filter((e) => progress[e.char] && progress[e.char].corrects > 0).length
        out.push({ grade: g, learned, total: entries.length })
      }
      setRows({ grades: out, stats: computeStats(progress) })
    }
    run()
  }, [session])

  if (!rows) return <div className="screen center">よみこみちゅう…</div>

  const { stats } = rows
  const rank = rankFor(stats.stars)
  const next = nextRank(stats.stars)

  return (
    <div className="screen scrollable">
      <h1>⭐ せいせき</h1>

      <div className="card level-card">
        <Mascot pose="happy" size={84} className="bob" />
        <div className="lc-body">
          <p className="lc-rank">{rank.emoji} {rank.name}</p>
          <p className="lc-stars">⭐ {stats.stars}こ あつめた</p>
          {next && (
            <>
              <div className="bar"><span style={{ width: Math.min(100, (stats.stars / next.min) * 100) + '%' }} /></div>
              <p className="hint">つぎの「{next.emoji} {next.name}」まで あと{next.min - stats.stars}こ</p>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>🎖️ メダル</h2>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const got = b.test(stats)
            return (
              <div key={b.id} className={'medal' + (got ? ' got' : '')}>
                <span className="medal-emoji">{got ? b.emoji : '？'}</span>
                <span className="medal-name">{b.name}</span>
              </div>
            )
          })}
        </div>
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
