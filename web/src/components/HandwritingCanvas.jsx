import { useEffect, useRef } from 'react'

// A pointer-drawing canvas that also records strokes as point sequences.
// - strokesRef.current holds an array of strokes (each an array of [x,y] in CSS px).
// - onClearRef.current is set to a clear() function.
export default function HandwritingCanvas({ size = 280, strokesRef, onClearRef }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const strokes = useRef([])
  const cur = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#3a3a3a'

    if (strokesRef) strokesRef.current = strokes.current

    const pos = (e) => {
      const r = canvas.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const start = (e) => {
      drawing.current = true
      const p = pos(e)
      last.current = p
      cur.current = [p]
      strokes.current.push(cur.current)
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!drawing.current) return
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(last.current[0], last.current[1])
      ctx.lineTo(p[0], p[1])
      ctx.stroke()
      last.current = p
      cur.current.push(p)
    }
    const end = () => { drawing.current = false; cur.current = null }

    canvas.addEventListener('pointerdown', start)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', end)
    canvas.addEventListener('pointercancel', end)

    if (onClearRef) {
      onClearRef.current = () => {
        ctx.clearRect(0, 0, size, size)
        strokes.current.length = 0
      }
    }
    return () => {
      canvas.removeEventListener('pointerdown', start)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', end)
      canvas.removeEventListener('pointercancel', end)
    }
  }, [size, strokesRef, onClearRef])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  )
}
