import { useEffect, useRef, useState } from 'react'
import * as api from '../api.js'
import { loadGrade, illustUrl, promptReading } from '../data.js'
import HandwritingCanvas from '../components/HandwritingCanvas.jsx'

function sample(arr, n, exclude) {
  const pool = arr.filter((x) => x !== exclude)
  const out = []
  while (out.length < n && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  }
  return out
}
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Quiz({ session, grade, mode, go }) {
  const [entries, setEntries] = useState(null)
  const [q, setQ] = useState(null) // { target, choices }
  const [phase, setPhase] = useState('question') // question | reveal | done
  const [result, setResult] = useState(null) // { correct, picked }
  const [score, setScore] = useState({ done: 0, correct: 0 })
  const [err, setErr] = useState('')
  const clearRef = useRef(null)

  useEffect(() => {
    loadGrade(grade).then(setEntries).catch((e) => setErr(e.message))
  }, [grade])

  useEffect(() => {
    if (entries) nextQuestion(entries)
  }, [entries])

  function nextQuestion(all) {
    const targets = all.filter((e) => e.hasIllust)
    if (targets.length === 0) {
      setErr('この がくねんは いま じゅんびちゅうです')
      return
    }
    const target = targets[Math.floor(Math.random() * targets.length)]
    const distractors = sample(all.map((e) => e.char), 3, target.char)
    const choices = shuffle([target.char, ...distractors])
    setQ({ target, choices })
    setResult(null)
    setPhase('question')
    if (clearRef.current) clearRef.current()
  }

  function finish(correct, picked = null) {
    api.recordAnswer(session.userId, q.target.char, correct)
    setResult({ correct, picked })
    setScore((s) => ({ done: s.done + 1, correct: s.correct + (correct ? 1 : 0) }))
    setPhase('done')
  }

  if (err) return <div className="card"><p className="error">{err}</p><button onClick={() => go('home')}>もどる</button></div>
  if (!q) return <div className="card center">よみこみちゅう…</div>

  const t = q.target

  return (
    <div>
      <div className="center" style={{ marginBottom: 8 }}>
        {mode === 'choose' ? 'えらぶ モード' : 'てがき モード'}・{score.correct}／{score.done}もん せいかい
      </div>

      <div className="card">
        <img className="illust" src={illustUrl(t.char)} alt={promptReading(t)} />
        <p className="reading">{promptReading(t)}</p>
        <p className="hint">この よみの かんじは？</p>

        {/* CHOOSE MODE */}
        {mode === 'choose' && phase !== 'done' && (
          <div className="choices">
            {q.choices.map((c) => (
              <button key={c} className="choice" onClick={() => finish(c === t.char, c)}>{c}</button>
            ))}
          </div>
        )}

        {/* WRITE MODE */}
        {mode === 'write' && phase === 'question' && (
          <div className="stack">
            <HandwritingCanvas onClearRef={clearRef} />
            <div className="row">
              <button className="ghost" onClick={() => clearRef.current && clearRef.current()}>けす</button>
              <button className="blue" onClick={() => setPhase('reveal')}>みほんを みる</button>
            </div>
          </div>
        )}
        {mode === 'write' && phase === 'reveal' && (
          <div className="stack">
            <p className="hint">おてほん と くらべてみよう</p>
            <div className="answer-key">{t.char}</div>
            <p className="center">おなじように かけたかな？</p>
            <div className="row">
              <button className="green" onClick={() => finish(true)}>かけた！</button>
              <button className="ghost" onClick={() => finish(false)}>もういちど</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === 'done' && (
          <div className="stack">
            <div className="big-emoji">{result.correct ? '🎉' : '💪'}</div>
            <div className="answer-key">{t.char}</div>
            <p className="center reading">{t.yomi.join('・')}</p>
            <p className="center">{t.meaning}</p>
            <ul>{t.examples.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
            <button className="big pink" onClick={() => nextQuestion(entries)}>つぎ へ ▶</button>
          </div>
        )}
      </div>

      <button className="ghost" onClick={() => go('home')}>やめる</button>
    </div>
  )
}
