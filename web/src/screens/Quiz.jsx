import { useEffect, useRef, useState } from 'react'
import * as api from '../api.js'
import { loadGrade, loadStrokes, illustUrl, promptReading } from '../data.js'
import { scoreHandwriting, GRADE_LABEL } from '../scoring.js'
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
  const [refStrokes, setRefStrokes] = useState({})
  const [q, setQ] = useState(null) // { target, choices }
  const [phase, setPhase] = useState('question') // question | reveal | done
  const [result, setResult] = useState(null) // { correct, picked } (choose)
  const [scoreRes, setScoreRes] = useState(null) // scoring result (write)
  const [drawnImg, setDrawnImg] = useState(null) // PNG of the child's drawing
  const [score, setScore] = useState({ done: 0, correct: 0 })
  const [err, setErr] = useState('')
  const clearRef = useRef(null)
  const strokesRef = useRef([])
  const snapshotRef = useRef(null)

  useEffect(() => {
    loadGrade(grade).then(setEntries).catch((e) => setErr(e.message))
    if (mode === 'write') loadStrokes(grade).then(setRefStrokes).catch(() => {})
  }, [grade, mode])

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
    setScoreRes(null)
    setPhase('question')
    if (clearRef.current) clearRef.current()
  }

  function record(correct) {
    api.recordAnswer(session, q.target.char, correct).catch(() => {})
    setScore((s) => ({ done: s.done + 1, correct: s.correct + (correct ? 1 : 0) }))
  }

  // choose mode: record immediately and show the answer
  function pick(picked) {
    const correct = picked === q.target.char
    record(correct)
    setResult({ correct, picked })
    setPhase('done')
  }

  // write mode: grade the handwriting, then reveal
  function checkWriting() {
    const ref = refStrokes[q.target.char]
    const res = scoreHandwriting(strokesRef.current, ref)
    if (import.meta.env.DEV) console.log('score', q.target.char, res)
    setDrawnImg(snapshotRef.current ? snapshotRef.current() : null)
    setScoreRes(res)
    setPhase('reveal')
  }

  // reveal buttons record the (possibly overridden) result and advance
  function finishWrite(correct) {
    record(correct)
    nextQuestion(entries)
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

        {/* CHOOSE MODE */}
        {mode === 'choose' && phase === 'question' && (
          <>
            <p className="hint">この よみの かんじは？</p>
            <div className="choices">
              {q.choices.map((c) => (
                <button key={c} className="choice" onClick={() => pick(c)}>{c}</button>
              ))}
            </div>
          </>
        )}
        {mode === 'choose' && phase === 'done' && (
          <div className="stack">
            <div className="big-emoji">{result.correct ? '🎉' : '💪'}</div>
            <div className="answer-key">{t.char}</div>
            <p className="center reading">{t.yomi.join('・')}</p>
            <p className="center">{t.meaning}</p>
            <ul>{t.examples.map((ex, i) => <li key={i}>{ex}</li>)}</ul>
            <button className="big pink" onClick={() => nextQuestion(entries)}>つぎ へ ▶</button>
          </div>
        )}

        {/* WRITE MODE — question */}
        {mode === 'write' && phase === 'question' && (
          <div className="stack">
            <p className="hint">この よみの かんじを かいてみよう</p>
            <HandwritingCanvas strokesRef={strokesRef} onClearRef={clearRef} snapshotRef={snapshotRef} />
            <div className="row">
              <button className="ghost" onClick={() => clearRef.current && clearRef.current()}>けす</button>
              <button className="blue" onClick={checkWriting}>こたえあわせ</button>
            </div>
          </div>
        )}

        {/* WRITE MODE — reveal (auto graded) */}
        {mode === 'write' && phase === 'reveal' && scoreRes && (
          <div className="stack">
            <div className="big-emoji">{GRADE_LABEL[scoreRes.grade].emoji}</div>
            <p className="center reading">{GRADE_LABEL[scoreRes.grade].text}</p>
            <div className="compare">
              <div>
                <p className="hint">かいた じ</p>
                <div className="compare-box">
                  {drawnImg && <img src={drawnImg} alt="かいた じ" />}
                </div>
              </div>
              <div>
                <p className="hint">おてほん</p>
                <div className="compare-box answer-key">{t.char}</div>
              </div>
            </div>
            <p className="center reading">{t.yomi.join('・')}</p>
            <p className="center">{t.meaning}</p>
            <button className={'big ' + GRADE_LABEL[scoreRes.grade].cls} onClick={() => finishWrite(scoreRes.correct)}>
              つぎ へ ▶
            </button>
            <button className="ghost" onClick={() => finishWrite(!scoreRes.correct)}>
              {scoreRes.correct ? 'う〜ん ちがったかも' : 'かけてた！ せいかいにする'}
            </button>
          </div>
        )}
      </div>

      <button className="ghost" onClick={() => go('home')}>やめる</button>
    </div>
  )
}
