// API handler for API Gateway HTTP API (payload v2).
// Routes: POST /api/signup, POST /api/login, GET /api/me,
//         GET /api/progress, POST /api/answer
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomBytes } from 'node:crypto'
import { hashPin, verifyPin, signToken, verifyToken } from './auth.mjs'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE = process.env.TABLE_NAME
const SECRET = process.env.JWT_SECRET

const json = (status, body) => ({
  statusCode: status,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})
const newId = () => 'u_' + randomBytes(6).toString('hex')

function auth(event) {
  const h = event.headers || {}
  const raw = h.authorization || h.Authorization || ''
  const token = raw.replace(/^Bearer\s+/i, '')
  return verifyToken(token, SECRET)
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method
  const path = event.rawPath || ''
  let payload = {}
  if (event.body) {
    try { payload = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) }
    catch { return json(400, { error: 'bad json' }) }
  }

  try {
    if (method === 'POST' && path.endsWith('/signup')) return await signup(payload)
    if (method === 'POST' && path.endsWith('/login')) return await login(payload)
    if (method === 'GET' && path.endsWith('/me')) return me(event)
    if (method === 'GET' && path.endsWith('/progress')) return await progress(event)
    if (method === 'POST' && path.endsWith('/answer')) return await answer(event, payload)
    return json(404, { error: 'not found' })
  } catch (e) {
    console.error(e)
    return json(500, { error: 'server error' })
  }
}

async function signup({ name, pin, grade }) {
  if (!name || !/^\d{4}$/.test(pin || '')) return json(400, { error: 'invalid input' })
  const userId = newId()
  const { salt, hash } = hashPin(pin)
  // LOGIN index enforces unique name via conditional put.
  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { PK: `LOGIN#${name}`, SK: 'PROFILE', userId },
      ConditionExpression: 'attribute_not_exists(PK)',
    }))
  } catch {
    return json(409, { error: 'name taken' })
  }
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: { PK: `USER#${userId}`, SK: 'PROFILE', name, grade: Number(grade) || 1, pinHash: hash, salt, createdAt: new Date().toISOString() },
  }))
  const token = signToken({ userId, name }, SECRET)
  return json(200, { token, userId, name, grade: Number(grade) || 1 })
}

async function login({ name, pin }) {
  if (!name || !pin) return json(400, { error: 'invalid input' })
  const idx = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: `LOGIN#${name}`, SK: 'PROFILE' } }))
  if (!idx.Item) return json(401, { error: 'bad credentials' })
  const prof = await ddb.send(new GetCommand({ TableName: TABLE, Key: { PK: `USER#${idx.Item.userId}`, SK: 'PROFILE' } }))
  if (!prof.Item || !verifyPin(pin, prof.Item.salt, prof.Item.pinHash)) return json(401, { error: 'bad credentials' })
  const token = signToken({ userId: prof.Item.userId, name }, SECRET)
  return json(200, { token, userId: prof.Item.userId, name, grade: prof.Item.grade })
}

function me(event) {
  const claims = auth(event)
  if (!claims) return json(401, { error: 'unauthorized' })
  return json(200, { userId: claims.userId, name: claims.name })
}

async function progress(event) {
  const claims = auth(event)
  if (!claims) return json(401, { error: 'unauthorized' })
  const res = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :p AND begins_with(SK, :k)',
    ExpressionAttributeValues: { ':p': `USER#${claims.userId}`, ':k': 'KANJI#' },
  }))
  const out = {}
  for (const it of res.Items || []) {
    out[it.SK.replace('KANJI#', '')] = { attempts: it.attempts, corrects: it.corrects, lastStudiedAt: it.lastStudiedAt }
  }
  return json(200, out)
}

async function answer(event, { char, correct }) {
  const claims = auth(event)
  if (!claims) return json(401, { error: 'unauthorized' })
  if (!char) return json(400, { error: 'invalid input' })
  const res = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `USER#${claims.userId}`, SK: `KANJI#${char}` },
    UpdateExpression: 'ADD attempts :one, corrects :c SET lastStudiedAt = :t',
    ExpressionAttributeValues: { ':one': 1, ':c': correct ? 1 : 0, ':t': new Date().toISOString() },
    ReturnValues: 'ALL_NEW',
  }))
  return json(200, { attempts: res.Attributes.attempts, corrects: res.Attributes.corrects, lastStudiedAt: res.Attributes.lastStudiedAt })
}
