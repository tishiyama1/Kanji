// API layer — the single seam between UI and backend.
//
// Two implementations behind one interface:
//   - localStorage (default, for `npm run dev`): runs with no server.
//   - HTTP API (when VITE_API_BASE is set, e.g. "/api" in production):
//     talks to API Gateway + Lambda + DynamoDB.
//
// Production builds set VITE_API_BASE via web/.env.production.

const API_BASE = import.meta.env.VITE_API_BASE || ''
const useApi = !!API_BASE

const LS_SESSION = 'kanji.session'
const LS_USERS = 'kanji.users'
const LS_PROGRESS = 'kanji.progress'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

// session ({ userId, name, grade, token? }) is always kept in localStorage.
export function currentSession() { return load(LS_SESSION, null) }
export function logout() { localStorage.removeItem(LS_SESSION) }

// ---------- HTTP API implementation ----------
async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(data.error))
  return data
}

function errorMessage(code) {
  switch (code) {
    case 'name taken': return 'その なまえは もう つかわれています'
    case 'bad credentials': return 'なまえ か あんしょうばんごうが ちがいます'
    default: return 'エラーが おきました'
  }
}

// ---------- localStorage implementation ----------
async function weakHash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
const newId = () => 'u_' + Math.random().toString(36).slice(2, 10)

// ---------- public interface ----------
export async function signup({ name, pin, grade }) {
  let session
  if (useApi) {
    const d = await apiFetch('/signup', { method: 'POST', body: { name, pin, grade } })
    session = { userId: d.userId, name: d.name, grade: d.grade, token: d.token }
  } else {
    const users = load(LS_USERS, {})
    if (users[name]) throw new Error('その なまえは もう つかわれています')
    const userId = newId()
    users[name] = { userId, name, grade, pinHash: await weakHash(pin) }
    save(LS_USERS, users)
    session = { userId, name, grade }
  }
  save(LS_SESSION, session)
  return session
}

export async function login({ name, pin }) {
  let session
  if (useApi) {
    const d = await apiFetch('/login', { method: 'POST', body: { name, pin } })
    session = { userId: d.userId, name: d.name, grade: d.grade, token: d.token }
  } else {
    const users = load(LS_USERS, {})
    const user = users[name]
    if (!user || user.pinHash !== (await weakHash(pin))) throw new Error('なまえ か あんしょうばんごうが ちがいます')
    session = { userId: user.userId, name: user.name, grade: user.grade }
  }
  save(LS_SESSION, session)
  return session
}

export async function getProgress(session) {
  if (useApi) return apiFetch('/progress', { token: session.token })
  const all = load(LS_PROGRESS, {})
  return all[session.userId] ?? {}
}

export async function recordAnswer(session, char, correct) {
  if (useApi) return apiFetch('/answer', { method: 'POST', body: { char, correct }, token: session.token })
  const all = load(LS_PROGRESS, {})
  const mine = all[session.userId] ?? {}
  const cur = mine[char] ?? { attempts: 0, corrects: 0, lastStudiedAt: null }
  cur.attempts += 1
  if (correct) cur.corrects += 1
  cur.lastStudiedAt = new Date().toISOString()
  mine[char] = cur
  all[session.userId] = mine
  save(LS_PROGRESS, all)
  return cur
}
