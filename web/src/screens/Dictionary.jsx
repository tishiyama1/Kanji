import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import * as api from '../api.js'
import { loadGrade, illustUrl } from '../data.js'

export default function Dictionary({ session, grade, go }) {
  const [entries, setEntries] = useState(null)
  const [progress, setProgress] = useState({})
  const [open, setOpen] = useState(null) // the entry shown in the popup
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
    <div className="screen scrollable">
      <h1>📖 かんじ じてん</h1>
      <div className="card">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="かんじ か よみ で さがす" />
      </div>

      <div className="dict-grid">
        {filtered.map((e) => (
          <button className="dict-tile" key={e.char} onClick={() => setOpen(e)}>
            <span className="k">{e.char}</span>
            <span className="y">{e.yomi[0]}</span>
          </button>
        ))}
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
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        {entry.hasIllust && <img className="illust" src={illustUrl(entry.char)} alt={entry.yomi[0]} />}
        <div className="answer-key">{entry.char}</div>
        <p className="center reading">{entry.yomi.join('・')}</p>
        <p className="center">{entry.meaning}</p>
        <p className="center">かくすう：{entry.strokes}かく</p>
        <p className="center">
          <span className="badge">せいかい {p.corrects}かい</span>{' '}
          <span className="badge">ちょうせん {p.attempts}かい</span>
        </p>
        <p className="hint" style={{ marginBottom: 4 }}>れいぶん</p>
        <ul>{entry.examples.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
      </div>
    </div>
  )
}
