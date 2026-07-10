import { useEffect, useRef } from 'react'

// A simple pointer-drawing canvas. Exposes a clear() via ref-like prop.
export default function HandwritingCanvas({ size = 280, onClearRef }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)

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

    const pos = (e) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const start = (e) => {
      drawing.current = true
      last.current = pos(e)
      canvas.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!drawing.current) return
      const p = pos(e)
      ctx.beginPath()
      ctx.moveTo(last.current.x, last.current.y)
      ctx.lineTo(p.x, p.y)
      ctx.stroke()
      last.current = p
    }
    const end = () => { drawing.current = false }

    canvas.addEventListener('pointerdown', start)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', end)
    canvas.addEventListener('pointercancel', end)

    if (onClearRef) {
      onClearRef.current = () => ctx.clearRect(0, 0, size, size)
    }
    return () => {
      canvas.removeEventListener('pointerdown', start)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', end)
      canvas.removeEventListener('pointercancel', end)
    }
  }, [size, onClearRef])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  )
}
