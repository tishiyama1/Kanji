import { useMemo } from 'react'

const COLORS = ['#FF8FB1', '#62C6EC', '#85C46A', '#FFD25A', '#B98BE0', '#FF9A4D']

// Lightweight CSS confetti burst. Re-mount (via key) to replay.
export default function Confetti({ count = 26 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.25,
        dur: 1.1 + Math.random() * 0.9,
        drift: -60 + Math.random() * 120,
        spin: 360 + Math.random() * 540,
        size: 7 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    [count]
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: p.left + '%',
            width: p.size,
            height: p.size * (p.round ? 1 : 0.55),
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: p.delay + 's',
            animationDuration: p.dur + 's',
            '--drift': p.drift + 'px',
            '--spin': p.spin + 'deg',
          }}
        />
      ))}
    </div>
  )
}
