// ふでまる — the app's mascot, a little ink-brush spirit.
// Drawn inline so poses can swap freely. Same flat picture-book style
// as the kanji illustrations.
export default function Mascot({ pose = 'wave', size = 96, className = '' }) {
  const cheer = pose === 'cheer'
  const oops = pose === 'oops'
  const happy = pose === 'happy' || cheer
  return (
    <svg
      className={'mascot ' + className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="ふでまる"
    >
      {/* sparkles when cheering */}
      {cheer && (
        <g fill="#FFD25A">
          <path d="M14 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          <path d="M104 20 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
        </g>
      )}

      {/* brush-tip topknot */}
      <path d="M60 6 C70 10 72 22 66 30 L54 30 C48 22 50 10 60 6 Z" fill="#4a3b32" />
      <path d="M60 14 C64 17 65 23 62 28 L58 28 C55 23 56 17 60 14 Z" fill="#6b584a" />

      {/* arms (behind body) */}
      {cheer ? (
        <g fill="#FFF3DF" stroke="#E8D5B8" strokeWidth="3">
          <rect x="8" y="44" width="26" height="13" rx="6.5" transform="rotate(-38 21 50)" />
          <rect x="86" y="44" width="26" height="13" rx="6.5" transform="rotate(38 99 50)" />
        </g>
      ) : oops ? (
        <g fill="#FFF3DF" stroke="#E8D5B8" strokeWidth="3">
          <rect x="10" y="72" width="24" height="13" rx="6.5" transform="rotate(18 22 78)" />
          <rect x="86" y="72" width="24" height="13" rx="6.5" transform="rotate(-18 98 78)" />
        </g>
      ) : (
        <g fill="#FFF3DF" stroke="#E8D5B8" strokeWidth="3">
          <rect x="6" y="46" width="26" height="13" rx="6.5" transform="rotate(-30 19 52)" />
          <rect x="88" y="66" width="24" height="13" rx="6.5" transform="rotate(-10 100 72)" />
        </g>
      )}

      {/* body */}
      <path
        d="M60 26 C92 26 102 50 102 72 C102 96 84 108 60 108 C36 108 18 96 18 72 C18 50 28 26 60 26 Z"
        fill="#FFF9EE"
        stroke="#E8D5B8"
        strokeWidth="3.5"
      />

      {/* face */}
      {oops ? (
        <g>
          <line x1="44" y1="60" x2="53" y2="64" stroke="#4a3b32" strokeWidth="4" strokeLinecap="round" />
          <line x1="76" y1="60" x2="67" y2="64" stroke="#4a3b32" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="60" cy="80" rx="7" ry="8" fill="#4a3b32" />
          <path d="M88 56 q6 8 0 14" fill="none" stroke="#62C6EC" strokeWidth="5" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {happy ? (
            <g stroke="#4a3b32" strokeWidth="4.5" fill="none" strokeLinecap="round">
              <path d="M42 62 q6 -8 12 0" />
              <path d="M66 62 q6 -8 12 0" />
            </g>
          ) : (
            <g fill="#4a3b32">
              <circle cx="48" cy="62" r="5" />
              <circle cx="72" cy="62" r="5" />
            </g>
          )}
          <path
            d={cheer ? 'M50 76 q10 14 20 0 q-10 6 -20 0 Z' : 'M52 78 q8 8 16 0'}
            fill={cheer ? '#E2648E' : 'none'}
            stroke="#4a3b32"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* cheeks */}
      <circle cx="36" cy="74" r="6.5" fill="#FFC3D8" />
      <circle cx="84" cy="74" r="6.5" fill="#FFC3D8" />
    </svg>
  )
}
