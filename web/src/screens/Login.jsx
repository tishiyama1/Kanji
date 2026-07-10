import { useState } from 'react'
import * as api from '../api.js'
import KanaKeyboard from '../components/KanaKeyboard.jsx'
import NumberPad from '../components/NumberPad.jsx'

const DAKUTEN = {
  か: 'が', き: 'ぎ', く: 'ぐ', け: 'げ', こ: 'ご',
  さ: 'ざ', し: 'じ', す: 'ず', せ: 'ぜ', そ: 'ぞ',
  た: 'だ', ち: 'ぢ', つ: 'づ', て: 'で', と: 'ど',
  は: 'ば', ひ: 'び', ふ: 'ぶ', へ: 'べ', ほ: 'ぼ',
  う: 'ゔ',
}
const HANDAKUTEN = { は: 'ぱ', ひ: 'ぴ', ふ: 'ぷ', へ: 'ぺ', ほ: 'ぽ' }

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [grade, setGrade] = useState(1)
  const [field, setField] = useState('name') // which input the keyboard edits
  const [error, setError] = useState('')

  const addChar = (ch) => { if (name.length < 8) setName(name + ch) }
  const addDigit = (d) => { if (pin.length < 4) setPin(pin + d) }
  const special = (kind) => {
    if (kind === 'back') return setName(name.slice(0, -1))
    const last = name.slice(-1)
    const map = kind === 'dakuten' ? DAKUTEN : HANDAKUTEN
    if (map[last]) setName(name.slice(0, -1) + map[last])
  }

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

        <div>
          <label>なまえ（ひらがな）</label>
          <div className={'display' + (field === 'name' ? ' active' : '')} onClick={() => setField('name')}>
            {name || <span className="placeholder">ここを おして いれてね</span>}
          </div>
        </div>

        <div>
          <label>あんしょうばんごう（4つの すうじ）</label>
          <div className={'display' + (field === 'pin' ? ' active' : '')} onClick={() => setField('pin')}>
            {pin ? '●'.repeat(pin.length) : <span className="placeholder">4つの すうじ</span>}
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label>がくねん</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)}>
              {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}ねんせい</option>)}
            </select>
          </div>
        )}

        {field === 'name'
          ? <KanaKeyboard onChar={addChar} onSpecial={special} />
          : <NumberPad onDigit={addDigit} onBack={() => setPin(pin.slice(0, -1))} />}

        {error && <p className="error">{error}</p>}
        <button className="big green" onClick={submit}>{mode === 'signup' ? 'とうろく する' : 'はじめる'}</button>
      </div>
    </div>
  )
}
