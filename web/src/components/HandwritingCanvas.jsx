import { useEffect, useRef } from 'react'

// A responsive square drawing canvas that records strokes as point sequences.
// It sizes itself to its parent container, so the layout controls how big it is.
// - strokesRef.current holds an array of strokes (each an array of [x,y] in CSS px).
// - onClearRef.current is set to a clear() function.
// - snapshotRef.current is set to a () => dataURL function.
export default function HandwritingCanvas({ strokesRef, onClearRef, snapshotRef }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const strokes = useRef([])
  const cur = useRef(null)
  const cssSize = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function setup() {
      const size = canvas.clientWidth
      if (!size || size === cssSize.current) return
      cssSize.current = size
      const dpr = window.devicePixelRatio || 1
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineWidth = Math.max(8, size * 0.045)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#3a3a3a'
      // resizing resets the buffer, so clear any in-progress drawing
      strokes.current.length = 0
    }
    setup()
    const ro = new ResizeObserver(setup)
    ro.observe(canvas)

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
        ctx.clearRect(0, 0, cssSize.current, cssSize.current)
        strokes.current.length = 0
      }
    }
    if (snapshotRef) snapshotRef.current = () => canvas.toDataURL('image/png')

    return () => {
      ro.disconnect()
      canvas.removeEventListener('pointerdown', start)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', end)
      canvas.removeEventListener('pointercancel', end)
    }
  }, [strokesRef, onClearRef, snapshotRef])

  return <canvas ref={canvasRef} className="hw-canvas" />
}
