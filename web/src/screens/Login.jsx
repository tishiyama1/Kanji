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
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [grade, setGrade] = useState(1)
  const [field, setField] = useState('name')
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
    <div className="screen login">
      <div className="login-top">
        <div className="login-head">
          <h1>🖍️ かんじ れんしゅう</h1>
          <div className="mode-toggle">
            <button className={'sm ' + (mode === 'login' ? 'pink' : 'ghost')} onClick={() => setMode('login')}>ログイン</button>
            <button className={'sm ' + (mode === 'signup' ? 'pink' : 'ghost')} onClick={() => setMode('signup')}>はじめて</button>
          </div>
        </div>

        <div className="login-fields">
          <div className="field-col name" onClick={() => setField('name')}>
            <label>なまえ</label>
            <div className={'display' + (field === 'name' ? ' active' : '')}>
              {name || <span className="placeholder">おして いれてね</span>}
            </div>
          </div>
          <div className="field-col pin" onClick={() => setField('pin')}>
            <label>あんしょうばんごう</label>
            <div className={'display' + (field === 'pin' ? ' active' : '')}>
              {pin ? '●'.repeat(pin.length) : <span className="placeholder">4つの すうじ</span>}
            </div>
          </div>
          {mode === 'signup' && (
            <div className="field-col grade">
              <label>がくねん</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((g) => <option key={g} value={g}>{g}ねん</option>)}
              </select>
            </div>
          )}
          <div className="field-col go">
            <button className="green submit" onClick={submit}>{mode === 'signup' ? 'とうろく' : 'はじめる'}</button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
      </div>

      <div className="kb-holder">
        {field === 'name'
          ? <KanaKeyboard onChar={addChar} onSpecial={special} />
          : <NumberPad onDigit={addDigit} onBack={() => setPin(pin.slice(0, -1))} />}
      </div>
    </div>
  )
}
