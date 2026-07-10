import { useState } from 'react'
import * as api from '../api.js'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [grade, setGrade] = useState(1)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('なまえを いれてね')
    if (!/^\d{4}$/.test(pin)) return setError('あんしょうばんごうは 4つの すうじだよ')
    try {
      const session =
        mode === 'signup'
          ? await api.signup({ name: name.trim(), pin, grade: Number(grade) })
          : await api.login({ name: name.trim(), pin })
      onLogin(session)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <h1>かんじ れんしゅう</h1>
      <div className="card stack">
        <div className="row">
          <button className={mode === 'login' ? 'pink' : 'ghost'} onClick={() => setMode('login')}>ログイン</button>
          <button className={mode === 'signup' ? 'pink' : 'ghost'} onClick={() => setMode('signup')}>はじめて</button>
        </div>

        <div className="field">
          <label>なまえ（ひらがな）</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="たとえば：さくら" />
        </div>

        <div className="field">
          <label>あんしょうばんごう（4つの すうじ）</label>
          <input type="tel" inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="●●●●" />
        </div>

        {mode === 'signup' && (
          <div className="field">
            <label>がくねん</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}ねんせい</option>)}
            </select>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <button className="big green" onClick={submit}>{mode === 'signup' ? 'とうろく する' : 'はじめる'}</button>
      </div>
    </div>
  )
}
