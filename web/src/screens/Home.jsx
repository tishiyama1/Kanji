import { useEffect, useState } from 'react'
import * as api from '../api.js'
import Mascot from '../components/Mascot.jsx'
import { computeStats, rankFor, nextRank } from '../level.js'
import { playTap } from '../sound.js'

function greeting() {
  const h = new Date().getHours()
  if (h < 10) return 'おはよう！'
  if (h < 17) return 'こんにちは！'
  return 'こんばんは！'
}

const CHEERS = [
  'きょうも いっしょに がんばろう！',
  'どの かんじに する？',
  'ほしを あつめて レベルアップ！',
  'てがきも やってみてね！',
]

export default function Home({ session, go }) {
  const [grade, setGrade] = useState(Math.min(session.grade || 1, 3))
  const [stats, setStats] = useState(null)
  const [cheer] = useState(() => CHEERS[Math.floor(Math.random() * CHEERS.length)])

  useEffect(() => {
    api.getProgress(session).then((p) => setStats(computeStats(p))).catch(() => setStats(computeStats({})))
  }, [session])

  const rank = stats ? rankFor(stats.stars) : null
  const next = stats ? nextRank(stats.stars) : null

  return (
    <div className="screen scrollable home">
      <div className="hero">
        <Mascot pose="wave" size={104} className="bob" />
        <div className="hero-text">
          <p className="hero-hello">{greeting()} {session.name}さん</p>
          <p className="hero-cheer">{cheer}</p>
        </div>
      </div>

      {stats && (
        <div className="stat-row">
          <span className="stat-chip">⭐ {stats.stars}</span>
          {rank && <span className="stat-chip rank">{rank.emoji} {rank.name}</span>}
          {next && (
            <span className="stat-chip next">
              つぎまで {next.min - stats.stars}こ
              <span className="mini-bar"><span style={{ width: Math.min(100, (stats.stars / next.min) * 100) + '%' }} /></span>
            </span>
          )}
        </div>
      )}

      <div className="grade-pills">
        {[1, 2, 3, 4, 5, 6].map((g) => (
          <button
            key={g}
            className={'pill' + (g === grade ? ' on' : '')}
            disabled={g > 3}
            onClick={() => { playTap(); setGrade(g) }}
          >
            {g}ねん
          </button>
        ))}
      </div>

      <div className="mode-cards">
        <button className="mode-card pink" onClick={() => { playTap(); go('quiz', { grade, mode: 'choose' }) }}>
          <span className="mc-emoji">✏️</span>
          <span className="mc-title">えらぶ</span>
          <span className="mc-sub">よっつの なかから えらぼう</span>
        </button>
        <button className="mode-card blue" onClick={() => { playTap(); go('quiz', { grade, mode: 'write' }) }}>
          <span className="mc-emoji">🖌️</span>
          <span className="mc-title">てがき</span>
          <span className="mc-sub">ゆびで かんじを かいてみよう</span>
        </button>
      </div>

      <div className="row">
        <button className="green" onClick={() => { playTap(); go('dictionary', { grade }) }}>📖 ずかん</button>
        <button className="yellow" onClick={() => { playTap(); go('progress') }}>⭐ せいせき</button>
      </div>
    </div>
  )
}
