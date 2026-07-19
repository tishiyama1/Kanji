import { useEffect, useRef, useState } from 'react'
import * as api from '../api.js'
import { loadGrade, loadStrokes, illustUrl, promptReading } from '../data.js'
import { scoreHandwriting, GRADE_LABEL } from '../scoring.js'
import HandwritingCanvas from '../components/HandwritingCanvas.jsx'

// Show the example word with the kanji's reading emphasized.
function EmphWord({ word, reading }) {
  if (!word) return <p className="reading">{reading}</p>
  const i = word.indexOf(reading)
  if (i < 0) return <p className="word">{word}</p>
  return (
    <p className="word">
      {word.slice(0, i)}<span className="emph">{reading}</span>{word.slice(i + reading.length)}
    </p>
  )
}

// How confusable is candidate `c` with the target `t`?
// Higher = looks or sounds more alike -> a better (trickier) distractor.
function confusability(t, c) {
  let s = 0
  // shape: shared components / radicals
  const tp = new Set(t.parts || [])
  for (const p of c.parts || []) if (tp.has(p)) s += 3
  // sound: shared kana across all readings, plus same opening sound
  const tk = new Set((t.yomi || []).join(''))
  for (const ch of new Set((c.yomi || []).join(''))) if (tk.has(ch)) s += 1
  if (t.yomi?.[0]?.[0] && t.yomi[0][0] === c.yomi?.[0]?.[0]) s += 2
  // close stroke count feels similar too (small nudge)
  if (Math.abs((t.strokes || 0) - (c.strokes || 0)) <= 1) s += 1
  return s
}

// Pick n distractors biased toward look-alikes / sound-alikes, with enough
// randomness that the same options don't repeat every time.
function pickDistractors(all, target, n) {
  const scored = all
    .filter((e) => e.char !== target.char)
    .map((e) => ({ char: e.char, score: confusability(target, e) + Math.random() * 2 }))
    .sort((a, b) => b.score - a.score)
  return scored.slice(0, n).map((x) => x.char)
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
  const [q, setQ] = useState(null)
  const [phase, setPhase] = useState('question') // question | reveal | done | complete
  const [result, setResult] = useState(null)
  const [scoreRes, setScoreRes] = useState(null)
  const [drawnImg, setDrawnImg] = useState(null)
  const [score, setScore] = useState({ done: 0, correct: 0 })
  const [roundTotal, setRoundTotal] = useState(0)
  const [err, setErr] = useState('')
  const clearRef = useRef(null)
  const strokesRef = useRef([])
  const snapshotRef = useRef(null)
  const deckRef = useRef([])       // shuffled once per round: no repeats
  const lastCharRef = useRef(null) // avoid同じ字の連続 (across rounds)

  useEffect(() => {
    loadGrade(grade).then(setEntries).catch((e) => setErr(e.message))
    if (mode === 'write') loadStrokes(grade).then(setRefStrokes).catch(() => {})
  }, [grade, mode])

  useEffect(() => {
    if (entries) startRound(entries)
  }, [entries])

  const ROUND_SIZE = 10

  function startRound(all) {
    // quizzable = anything with an example word (illustration optional)
    const targets = all.filter((e) => e.word)
    if (targets.length === 0) { setErr('この がくねんは いま じゅんびちゅうです'); return }
    // one round = up to ROUND_SIZE kanji, randomly drawn, no repeats within it
    const deck = shuffle(targets).slice(0, ROUND_SIZE)
    // don't let the new round open with the kanji we just saw
    if (deck.length > 1 && deck[deck.length - 1].char === lastCharRef.current) {
      ;[deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]
    }
    deckRef.current = deck
    setRoundTotal(deck.length)
    setScore({ done: 0, correct: 0 })
    nextQuestion(all)
  }

  function nextQuestion(all) {
    const deck = deckRef.current
    if (deck.length === 0) { setPhase('complete'); return }
    const target = deck.pop()
    lastCharRef.current = target.char
    const distractors = pickDistractors(all, target, 3)
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
  function pick(picked) {
    const correct = picked === q.target.char
    record(correct)
    setResult({ correct, picked })
    setPhase('done')
  }
  function checkWriting() {
    const res = scoreHandwriting(strokesRef.current, refStrokes[q.target.char])
    if (import.meta.env.DEV) console.log('score', q.target.char, res)
    setDrawnImg(snapshotRef.current ? snapshotRef.current() : null)
    setScoreRes(res)
    setPhase('reveal')
  }
  function finishWrite(correct) { record(correct); nextQuestion(entries) }

  if (err) return <div className="screen center"><div className="card"><p className="error">{err}</p><button onClick={() => go('home')}>もどる</button></div></div>
  if (!q && phase !== 'complete') return <div className="screen center">よみこみちゅう…</div>

  const t = q?.target
  const total = roundTotal

  return (
    <div className="screen quiz">
      <div className="quiz-status">
        <span className="chip">{mode === 'choose' ? '✏️ えらぶ' : '🖌️ てがき'}</span>
        <span className="chip">⭐ {score.correct}／{total}もん</span>
        <button className="ghost sm" onClick={() => go('home')}>やめる</button>
      </div>

      {/* ROUND COMPLETE */}
      {phase === 'complete' ? (
        <div className="quiz-main">
          <div className="result">
            <div className="big-emoji">🏆</div>
            <p className="reading">ぜんぶ できた！</p>
            <p className="center meaning">{score.correct}／{score.done}もん せいかい</p>
            <button className="big pink" onClick={() => startRound(entries)}>もういちど あそぶ</button>
            <button className="ghost" onClick={() => go('home')}>おわる</button>
          </div>
        </div>
      ) : (
        <div className="quiz-main">
          <div className="quiz-visual">
            {t.hasIllust
              ? <img className="illust" src={illustUrl(t.char)} alt={promptReading(t)} />
              : phase === 'question'
                ? <div className="word-card"><EmphWord word={t.word} reading={promptReading(t)} /></div>
                : <div className="answer-key">{t.char}</div>}
            {t.hasIllust && (phase === 'question'
              ? <EmphWord word={t.word} reading={promptReading(t)} />
              : <div className="answer-key sm">{t.char}</div>)}
          </div>

          <div className={'quiz-action' + (mode === 'write' && phase === 'question' ? ' stretch' : '')}>
            {/* CHOOSE — question */}
            {mode === 'choose' && phase === 'question' && (
              <>
                <p className="hint">いろの ところの かんじは？</p>
                <div className="choices">
                  {q.choices.map((c) => (
                    <button key={c} className="choice" onClick={() => pick(c)}>{c}</button>
                  ))}
                </div>
              </>
            )}

            {/* WRITE — question */}
            {mode === 'write' && phase === 'question' && (
              <>
                <p className="hint">いろの ところの かんじを かいてみよう</p>
                <div className="canvas-holder"><HandwritingCanvas strokesRef={strokesRef} onClearRef={clearRef} snapshotRef={snapshotRef} /></div>
                <div className="row">
                  <button className="ghost" onClick={() => clearRef.current && clearRef.current()}>けす</button>
                  <button className="blue" onClick={checkWriting}>こたえあわせ</button>
                </div>
              </>
            )}

            {/* CHOOSE — result */}
            {mode === 'choose' && phase === 'done' && (
              <div className="result">
                <div className="big-emoji">{result.correct ? '🎉' : '💪'}</div>
                <p className="center reading">{t.yomi.join('・')}</p>
                <p className="center meaning">{t.meaning}</p>
                <button className="big pink" onClick={() => nextQuestion(entries)}>つぎ へ ▶</button>
              </div>
            )}

            {/* WRITE — reveal */}
            {mode === 'write' && phase === 'reveal' && scoreRes && (
              <div className="result">
                <div className="big-emoji sm">{GRADE_LABEL[scoreRes.grade].emoji}</div>
                <p className="center reading">{GRADE_LABEL[scoreRes.grade].text}</p>
                <div className="compare">
                  <div><p className="hint">かいた じ</p><div className="compare-box">{drawnImg && <img src={drawnImg} alt="かいた じ" />}</div></div>
                  <div><p className="hint">おてほん</p><div className="compare-box answer-key">{t.char}</div></div>
                </div>
                <button className={'big ' + GRADE_LABEL[scoreRes.grade].cls} onClick={() => finishWrite(scoreRes.correct)}>つぎ へ ▶</button>
                <button className="ghost sm" onClick={() => finishWrite(!scoreRes.correct)}>
                  {scoreRes.correct ? 'う〜ん ちがったかも' : 'かけてた！ せいかいにする'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
