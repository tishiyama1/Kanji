import { useState } from 'react'

export default function Home({ session, go }) {
  const [grade, setGrade] = useState(session.grade || 1)

  return (
    <div className="screen scrollable">
      <h1>なにを する？</h1>

      <div className="card">
        <label>がくねん を えらぶ</label>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {[1, 2].map((g) => <option key={g} value={g}>{g}ねんせい</option>)}
          {[3, 4, 5, 6].map((g) => <option key={g} value={g} disabled>{g}ねんせい（じゅんびちゅう）</option>)}
        </select>
      </div>

      <div className="card stack">
        <h2>クイズ</h2>
        <button className="big pink" onClick={() => go('quiz', { grade, mode: 'choose' })}>
          ✏️ えらぶ モード
        </button>
        <button className="big blue" onClick={() => go('quiz', { grade, mode: 'write' })}>
          🖌️ てがき モード
        </button>
      </div>

      <div className="row">
        <button className="green" onClick={() => go('dictionary', { grade })}>📖 じてん</button>
        <button className="yellow" onClick={() => go('progress')}>⭐ せいせき</button>
      </div>
    </div>
  )
}
