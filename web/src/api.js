// API layer.
//
// This module is the single seam between the UI and the backend.
// For the MVP it is backed by localStorage so the app runs with no server.
// To switch to the real AWS backend (API Gateway + Lambda + DynamoDB),
// replace the bodies below with fetch() calls to /api/* — the function
// signatures are meant to stay the same.

const LS_USERS = 'kanji.users'
const LS_SESSION = 'kanji.session'
const LS_PROGRESS = 'kanji.progress' // keyed by userId

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// NOTE: demo-only hash. The real backend must hash PINs server-side
// (e.g. bcrypt) and never trust the client. Do not treat this as secure.
async function weakHash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function newId() {
  return 'u_' + Math.random().toString(36).slice(2, 10)
}

export async function signup({ name, pin, grade }) {
  const users = load(LS_USERS, {})
  if (users[name]) {
    throw new Error('その なまえは もう つかわれています')
  }
  const userId = newId()
  users[name] = { userId, name, grade, pinHash: await weakHash(pin) }
  save(LS_USERS, users)
  const session = { userId, name, grade }
  save(LS_SESSION, session)
  return session
}

export async function login({ name, pin }) {
  const users = load(LS_USERS, {})
  const user = users[name]
  if (!user || user.pinHash !== (await weakHash(pin))) {
    throw new Error('なまえ か あんしょうばんごうが ちがいます')
  }
  const session = { userId: user.userId, name: user.name, grade: user.grade }
  save(LS_SESSION, session)
  return session
}

export function currentSession() {
  return load(LS_SESSION, null)
}

export function logout() {
  localStorage.removeItem(LS_SESSION)
}

export function getProgress(userId) {
  const all = load(LS_PROGRESS, {})
  return all[userId] ?? {}
}

export function recordAnswer(userId, char, correct) {
  const all = load(LS_PROGRESS, {})
  const mine = all[userId] ?? {}
  const cur = mine[char] ?? { attempts: 0, corrects: 0, lastStudiedAt: null }
  cur.attempts += 1
  if (correct) cur.corrects += 1
  cur.lastStudiedAt = new Date().toISOString()
  mine[char] = cur
  all[userId] = mine
  save(LS_PROGRESS, all)
  return cur
}
