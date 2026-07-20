import { useState } from 'react'
import * as api from './api.js'
import Login from './screens/Login.jsx'
import Home from './screens/Home.jsx'
import Quiz from './screens/Quiz.jsx'
import Dictionary from './screens/Dictionary.jsx'
import Progress from './screens/Progress.jsx'
import { soundOn, setSoundOn, playTap } from './sound.js'

export default function App() {
  const [session, setSession] = useState(api.currentSession())
  const [view, setView] = useState({ name: 'home' })
  const [sound, setSound] = useState(soundOn())

  if (!session) {
    return (
      <div className="app">
        <Login onLogin={(s) => { setSession(s); setView({ name: 'home' }) }} />
      </div>
    )
  }

  const go = (name, params = {}) => setView({ name, ...params })
  const logout = () => { api.logout(); setSession(null) }
  const toggleSound = () => {
    const next = !sound
    setSoundOn(next)
    setSound(next)
    if (next) playTap()
  }

  return (
    <div className="app">
      <div className="topbar">
        <button className="ghost sm" onClick={() => go('home')}>🏠</button>
        <span className="name">{session.name} さん</span>
        <span className="topbar-right">
          <button className="ghost sm" onClick={toggleSound} aria-label="おと">{sound ? '🔊' : '🔇'}</button>
          <button className="ghost sm" onClick={logout}>ばいばい</button>
        </span>
      </div>

      {view.name === 'home' && <Home session={session} go={go} />}
      {view.name === 'quiz' && <Quiz session={session} grade={view.grade} mode={view.mode} go={go} />}
      {view.name === 'dictionary' && <Dictionary session={session} grade={view.grade} go={go} />}
      {view.name === 'progress' && <Progress session={session} go={go} />}
    </div>
  )
}
