import { useEffect, useRef, useState } from 'react'
import * as api from '../api.js'
import { loadGrade, loadStrokes, illustUrl, promptReading, wordVariants, pickVariant } from '../data.js'
import { scoreHandwriting, GRADE_LABEL } from '../scoring.js'
import HandwritingCanvas from '../components/HandwritingCanvas.jsx'
import Mascot from '../components/Mascot.jsx'
import Confetti from '../components/Confetti.jsx'
import { playTap, playCorrect, playWrong, playFanfare } from '../sound.js'

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
function confusability(t, c) {
  let s = 0
  const tp = new Set(t.parts || [])
  for (const p of c.parts || []) if (tp.has(p)) s += 3
  const tk = new Set((t.yomi || []).join(''))
  for (const ch of new Set((c.yomi || []).join(''))) if (tk.has(ch)) s += 1
  if (t.yomi?.[0]?.[0] && t.yomi[0][0] === c.yomi?.[0]?.[0]) s += 2
  if (Math.abs((t.strokes || 0) - (c.strokes || 0)) <= 1) s += 1
  return s
}

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

const COMBO_WORDS = { 2: 'いいね！', 3: 'すごい！', 5: 'せんせいみたい！', 7: 'てんさい！', 10: 'でんせつ！！' }
function comboWord(streak) {
  let w = ''
  for (const k of Object.keys(COMBO_WORDS)) if (streak >= +k) w = COMBO_WORDS[k]
  return w
}

function praiseFor(correct, total) {
  const pct = total ? correct / total : 0
  if (pct === 1) return { text: 'パーフェクト！！', pose: 'cheer' }
  if (pct >= 0.8) return { text: 'すっごーい！', pose: 'cheer' }
  if (pct >= 0.5) return { text: 'よく がんばったね！', pose: 'happy' }
  return { text: 'つぎは もっと できるよ！', pose: 'happy' }
}

const ROUND_SIZE = 10

export default function Quiz({ session, grade, mode, go }) {
  const [entries, setEntries] = useState(null)
  const [refStrokes, setRefStrokes] = useState({})
  const [q, setQ] = useState(null)
  const [phase, setPhase] = useState('question') // question | reveal | done | complete
  const [result, setResult] = useState(null)     // { correct, picked } (choose)
  const [scoreRes, setScoreRes] = useState(null) // handwriting grade
  const [drawnImg, setDrawnImg] = useState(null)
  const [results, setResults] = useState([])     // per-question outcome for dots + summary
  const [streak, setStreak] = useState(0)
  const [roundTotal, setRoundTotal] = useState(0)
  const [err, setErr] = useState('')
  const clearRef = useRef(null)
  const strokesRef = useRef([])
  const snapshotRef = useRef(null)
  const deckRef = useRef([])
  const lastCharRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    loadGrade(grade).then(setEntries).catch((e) => setErr(e.message))
    if (mode === 'write') loadStrokes(grade).then(setRefStrokes).catch(() => {})
    return () => clearTimeout(timerRef.current)
  }, [grade, mode])

  useEffect(() => {
    if (entries) startRound(entries)
  }, [entries])

  useEffect(() => {
    if (phase === 'complete') playFanfare()
  }, [phase])

  function startRound(all) {
    const targets = all.filter((e) => wordVariants(e))
    if (targets.length === 0) { setErr('この がくねんは いま じゅんびちゅうです'); return }
    const deck = shuffle(targets).slice(0, ROUND_SIZE)
    if (deck.length > 1 && deck[deck.length - 1].char === lastCharRef.current) {
      ;[deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]]
    }
    deckRef.current = deck
    setRoundTotal(deck.length)
    setResults([])
    setStreak(0)
    nextQuestion(all)
  }

  function nextQuestion(all) {
    const deck = deckRef.current
    if (deck.length === 0) { setPhase('complete'); return }
    const target = deck.pop()
    lastCharRef.current = target.char
    const distractors = pickDistractors(all, target, 3)
    const choices = shuffle([target.char, ...distractors])
    const { word, read } = pickVariant(target) // vary the example word / reading
    setQ({ target, choices, word, read })
    setResult(null)
    setScoreRes(null)
    setPhase('question')
    if (clearRef.current) clearRef.current()
  }

  // records the outcome and returns the new streak (for sound pitch)
  function record(correct) {
    api.recordAnswer(session, q.target.char, correct).catch(() => {})
    setResults((r) => [...r, { char: q.target.char, ok: correct }])
    const next = correct ? streak + 1 : 0
    setStreak(next)
    return next
  }

  // choose mode: freeze the buttons, highlight right/wrong, then reveal
  function pick(picked) {
    if (result) return
    const correct = picked === q.target.char
    const s = record(correct)
    correct ? playCorrect(s) : playWrong()
    setResult({ correct, picked })
    timerRef.current = setTimeout(() => setPhase('done'), 650)
  }

  function checkWriting() {
    const res = scoreHandwriting(strokesRef.current, refStrokes[q.target.char])
    if (import.meta.env.DEV) console.log('score', q.target.char, res)
    setDrawnImg(snapshotRef.current ? snapshotRef.current() : null)
    setScoreRes(res)
    setPhase('reveal')
    res.correct ? playCorrect(streak + 1) : playWrong()
  }
  function finishWrite(correct) { record(correct); nextQuestion(entries) }

  if (err) return <div className="screen center"><div className="card"><p className="error">{err}</p><button onClick={() => go('home')}>もどる</button></div></div>
  if (!q && phase !== 'complete') return <div className="screen center">よみこみちゅう…</div>

  const t = q?.target
  const correctCount = results.filter((r) => r.ok).length
  const cw = comboWord(streak)

  return (
    <div className="screen quiz">
      <div className="quiz-status">
        <span className="chip">{mode === 'choose' ? '✏️ えらぶ' : '🖌️ てがき'}</span>
        {streak >= 2 && phase !== 'complete' && <span className="chip combo">🔥{streak}れんぞく</span>}
        <button className="ghost sm" onClick={() => go('home')}>やめる</button>
      </div>

      {/* round progress dots */}
      {phase !== 'complete' && (
        <div className="dots">
          {Array.from({ length: roundTotal }, (_, i) => {
            const r = results[i]
            const cls = r ? (r.ok ? 'dot ok' : 'dot ng') : i === results.length ? 'dot now' : 'dot'
            return <span key={i} className={cls}>{r ? (r.ok ? '★' : '・') : ''}</span>
          })}
        </div>
      )}

      {/* ROUND COMPLETE */}
      {phase === 'complete' ? (
        <div className="quiz-main">
          {correctCount / (roundTotal || 1) >= 0.8 && <Confetti count={36} />}
          {(() => { const p = praiseFor(correctCount, roundTotal); return (
            <div className="result">
              <Mascot pose={p.pose} size={110} className="bounce" />
              <p className="reading">{p.text}</p>
              <p className="center meaning">⭐を {correctCount}こ あつめたよ（{correctCount}／{roundTotal}もん）</p>
              <div className="sum-grid">
                {results.map((r, i) => (
                  <span key={i} className={'sum-chip ' + (r.ok ? 'ok' : 'ng')}>
                    <span className="sc-k">{r.char}</span>{r.ok ? '⭕' : '△'}
                  </span>
                ))}
              </div>
              <button className="big pink" onClick={() => { playTap(); startRound(entries) }}>もういちど あそぶ</button>
              <button className="ghost" onClick={() => go('home')}>おわる</button>
            </div>
          ) })()}
        </div>
      ) : (
        <div className="quiz-main">
          <div className="quiz-visual">
            {t.hasIllust
              ? <img className="illust" src={illustUrl(t.char)} alt={promptReading(t)} />
              : phase === 'question'
                ? <div className="word-card"><EmphWord word={q.word} reading={q.read} /></div>
                : <div className="answer-key">{t.char}</div>}
            {t.hasIllust && (phase === 'question'
              ? <EmphWord word={q.word} reading={q.read} />
              : <div className="answer-key sm">{t.char}</div>)}
          </div>

          <div className={'quiz-action' + (mode === 'write' && phase === 'question' ? ' stretch' : '')}>
            {/* CHOOSE — question (buttons freeze + highlight after a pick) */}
            {mode === 'choose' && phase === 'question' && (
              <>
                <p className="hint">いろの ところの かんじは？</p>
                <div className="choices">
                  {q.choices.map((c) => {
                    let cls = 'choice'
                    if (result) {
                      if (c === t.char) cls += ' correct'
                      else if (c === result.picked) cls += ' wrong'
                      else cls += ' faded'
                    }
                    return <button key={c} className={cls} disabled={!!result} onClick={() => pick(c)}>{c}</button>
                  })}
                </div>
              </>
            )}

            {/* WRITE — question */}
            {mode === 'write' && phase === 'question' && (
              <>
                <p className="hint">いろの ところの かんじを かいてみよう</p>
                <div className="canvas-holder"><HandwritingCanvas strokesRef={strokesRef} onClearRef={clearRef} snapshotRef={snapshotRef} /></div>
                <div className="row">
                  <button className="ghost" onClick={() => { playTap(); clearRef.current && clearRef.current() }}>けす</button>
                  <button className="blue" onClick={checkWriting}>こたえあわせ</button>
                </div>
              </>
            )}

            {/* CHOOSE — result */}
            {mode === 'choose' && phase === 'done' && (
              <div className="result">
                {result.correct && <Confetti />}
                <Mascot pose={result.correct ? 'cheer' : 'oops'} size={92} className={result.correct ? 'bounce' : ''} />
                {result.correct && cw && <p className="combo-word">🔥 {streak}れんぞく {cw}</p>}
                <p className="center reading">{t.yomi.join('・')}</p>
                <p className="center meaning">{t.meaning}</p>
                <button className="big pink" onClick={() => { playTap(); nextQuestion(entries) }}>つぎ へ ▶</button>
              </div>
            )}

            {/* WRITE — reveal */}
            {mode === 'write' && phase === 'reveal' && scoreRes && (
              <div className="result">
                {scoreRes.grade === 'perfect' && <Confetti />}
                <Mascot pose={scoreRes.correct ? 'cheer' : 'oops'} size={84} className={scoreRes.correct ? 'bounce' : ''} />
                <p className="center reading">{GRADE_LABEL[scoreRes.grade].emoji} {GRADE_LABEL[scoreRes.grade].text}</p>
                <div className="compare">
                  <div><p className="hint">かいた じ</p><div className="compare-box">{drawnImg && <img src={drawnImg} alt="かいた じ" />}</div></div>
                  <div><p className="hint">おてほん</p><div className="compare-box answer-key">{t.char}</div></div>
                </div>
                <button className={'big ' + GRADE_LABEL[scoreRes.grade].cls} onClick={() => { playTap(); finishWrite(scoreRes.correct) }}>つぎ へ ▶</button>
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
