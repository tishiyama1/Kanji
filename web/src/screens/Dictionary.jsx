import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import * as api from '../api.js'
import { loadGrade, illustUrl } from '../data.js'
import { playTap } from '../sound.js'

// The dictionary doubles as a collection book (ずかん):
//   ？ = まだ みつけてない / normal = れんしゅうちゅう / gold ⭐ = マスター(3+ correct)
export default function Dictionary({ session, grade, go }) {
  const [entries, setEntries] = useState(null)
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    loadGrade(grade).then(setEntries)
    api.getProgress(session).then(setProgress).catch(() => setProgress({}))
  }, [grade, session])

  if (!entries) return <div className="screen center">よみこみちゅう…</div>

  const filtered = entries.filter((e) =>
    !query || e.char.includes(query) || e.yomi.some((y) => y.includes(query))
  )
  const found = entries.filter((e) => (progress[e.char]?.corrects || 0) > 0).length
  const mastered = entries.filter((e) => (progress[e.char]?.corrects || 0) >= 3).length

  return (
    <div className="screen scrollable">
      <h1>📖 かんじずかん</h1>

      <div className="card zukan-head">
        <div className="zh-row">
          <span>みつけた <b>{found}</b>／{entries.length}</span>
          <span>⭐マスター <b>{mastered}</b></span>
        </div>
        <div className="bar"><span style={{ width: (found / entries.length) * 100 + '%' }} /></div>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="かんじ か よみ で さがす" />
      </div>

      <div className="dict-grid">
        {filtered.map((e) => {
          const c = progress[e.char]?.corrects || 0
          const state = c >= 3 ? 'gold' : c > 0 ? '' : 'locked'
          return (
            <button className={'dict-tile ' + state} key={e.char} onClick={() => { playTap(); setOpen(e) }}>
              {state === 'gold' && <span className="tile-star">⭐</span>}
              <span className="k">{state === 'locked' ? '？' : e.char}</span>
              <span className="y">{state === 'locked' ? '？？？' : e.yomi[0]}</span>
            </button>
          )
        })}
      </div>

      <button className="ghost" onClick={() => go('home')}>もどる</button>

      {open && createPortal(
        <KanjiPopup entry={open} progress={progress[open.char]} onClose={() => setOpen(null)} />,
        document.body
      )}
    </div>
  )
}

function KanjiPopup({ entry, progress, onClose }) {
  const p = progress || { attempts: 0, corrects: 0 }
  const mastered = p.corrects >= 3
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {mastered && <p className="center master-tag">⭐ マスター！</p>}
        {entry.hasIllust && <img className="illust" src={illustUrl(entry.char)} alt={entry.yomi[0]} />}
        <div className="answer-key">{entry.char}</div>
        <p className="center reading">{entry.yomi.join('・')}</p>
        <p className="center">{entry.meaning}</p>
        <p className="center">かくすう:{entry.strokes}かく</p>
        <p className="center">
          <span className="badge">せいかい {p.corrects}かい</span>{' '}
          <span className="badge">ちょうせん {p.attempts}かい</span>
        </p>
        {!mastered && p.corrects > 0 && (
          <p className="hint">あと {3 - p.corrects}かい せいかいで ⭐マスター！</p>
        )}
        <p className="hint" style={{ marginBottom: 4 }}>れいぶん</p>
        <ul>{entry.examples.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
      </div>
    </div>
  )
}
