import { useState } from 'react'

export default function Home({ session, go }) {
  const [grade, setGrade] = useState(Math.min(session.grade || 1, 3))

  return (
    <div className="screen scrollable home">
      <h1>きょうは なにを する？</h1>

      <div className="grade-pills">
        {[1, 2, 3, 4, 5, 6].map((g) => (
          <button
            key={g}
            className={'pill' + (g === grade ? ' on' : '')}
            disabled={g > 3}
            onClick={() => setGrade(g)}
          >
            {g}ねん
          </button>
        ))}
      </div>

      <div className="mode-cards">
        <button className="mode-card pink" onClick={() => go('quiz', { grade, mode: 'choose' })}>
          <span className="mc-emoji">✏️</span>
          <span className="mc-title">えらぶ</span>
          <span className="mc-sub">よっつの なかから えらぼう</span>
        </button>
        <button className="mode-card blue" onClick={() => go('quiz', { grade, mode: 'write' })}>
          <span className="mc-emoji">🖌️</span>
          <span className="mc-title">てがき</span>
          <span className="mc-sub">ゆびで かんじを かいてみよう</span>
        </button>
      </div>

      <div className="row">
        <button className="green" onClick={() => go('dictionary', { grade })}>📖 じてん</button>
        <button className="yellow" onClick={() => go('progress')}>⭐ せいせき</button>
      </div>
    </div>
  )
}
