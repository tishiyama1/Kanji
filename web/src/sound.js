// Tiny synthesized sound effects (Web Audio, no asset files).
// All triggers happen on user taps, so autoplay policies are satisfied.
const LS = 'kanji.sound'
let ctx = null

export function soundOn() {
  try { return JSON.parse(localStorage.getItem(LS)) ?? true } catch { return true }
}
export function setSoundOn(v) { localStorage.setItem(LS, JSON.stringify(!!v)) }

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// one enveloped tone; slide lets the pitch glide (for boings/whooshes)
function tone(freq, at, dur, { type = 'sine', gain = 0.1, slide = 0 } = {}) {
  const c = ac()
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

const safe = (fn) => { if (!soundOn()) return; try { fn() } catch { /* no audio available */ } }

export function playTap() {
  safe(() => tone(520, 0, 0.06, { type: 'triangle', gain: 0.05 }))
}

// cheerful ascending arpeggio; combo raises the key a step (caps out)
export function playCorrect(combo = 1) {
  safe(() => {
    const base = 523 * Math.pow(1.06, Math.min(combo - 1, 6)) // C5 upward
    tone(base, 0, 0.12, { type: 'triangle', gain: 0.09 })
    tone(base * 1.26, 0.09, 0.12, { type: 'triangle', gain: 0.09 })
    tone(base * 1.5, 0.18, 0.2, { type: 'triangle', gain: 0.09 })
  })
}

// soft, kind "boing" — never punishing
export function playWrong() {
  safe(() => {
    tone(300, 0, 0.18, { type: 'sine', gain: 0.07, slide: -140 })
    tone(200, 0.16, 0.22, { type: 'sine', gain: 0.06, slide: -80 })
  })
}

// round-complete fanfare
export function playFanfare() {
  safe(() => {
    const seq = [523, 659, 784, 1047]
    seq.forEach((f, i) => tone(f, i * 0.12, 0.16, { type: 'triangle', gain: 0.09 }))
    tone(784, 0.5, 0.3, { type: 'triangle', gain: 0.08 })
    tone(1047, 0.62, 0.45, { type: 'triangle', gain: 0.09 })
  })
}
