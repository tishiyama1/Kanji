// Auth helpers: PIN hashing (scrypt) and a minimal HMAC JWT.
// No external dependencies — uses Node's built-in crypto only.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'

export function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(pin, salt, 32).toString('hex')
  return { salt, hash }
}

export function verifyPin(pin, salt, expectedHash) {
  const { hash } = hashPin(pin, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export function signToken(payload, secret, expiresInSec = 60 * 60 * 24 * 30) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec }
  const p1 = b64url(JSON.stringify(header))
  const p2 = b64url(JSON.stringify(body))
  const sig = b64url(createHmac('sha256', secret).update(`${p1}.${p2}`).digest())
  return `${p1}.${p2}.${sig}`
}

export function verifyToken(token, secret) {
  const parts = (token || '').split('.')
  if (parts.length !== 3) return null
  const [p1, p2, sig] = parts
  const expected = b64url(createHmac('sha256', secret).update(`${p1}.${p2}`).digest())
  if (sig !== expected) return null
  try {
    const body = JSON.parse(Buffer.from(p2, 'base64').toString())
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null
    return body
  } catch {
    return null
  }
}
