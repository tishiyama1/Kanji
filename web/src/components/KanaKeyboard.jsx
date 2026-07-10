// Switch-style gojūon keyboard: vertical columns (あいうえお top→bottom),
// columns ordered left→right from あ to わ, function keys on the right.
const COLS = [
  ['あ', 'い', 'う', 'え', 'お'],
  ['か', 'き', 'く', 'け', 'こ'],
  ['さ', 'し', 'す', 'せ', 'そ'],
  ['た', 'ち', 'つ', 'て', 'と'],
  ['な', 'に', 'ぬ', 'ね', 'の'],
  ['は', 'ひ', 'ふ', 'へ', 'ほ'],
  ['ま', 'み', 'む', 'め', 'も'],
  ['や', 'ゆ', 'よ', 'ゃ', 'ゅ'],
  ['ら', 'り', 'る', 'れ', 'ろ'],
  ['わ', 'を', 'ん', 'ょ', 'っ'],
]

export default function KanaKeyboard({ onChar, onSpecial }) {
  return (
    <div className="kb">
      {COLS.flat().map((ch, i) => (
        <button key={i} className="kb-key" onClick={() => onChar(ch)}>{ch}</button>
      ))}
      <button className="kb-key fn" style={{ gridColumn: 11, gridRow: 1 }} onClick={() => onSpecial('dakuten')}>゛</button>
      <button className="kb-key fn" style={{ gridColumn: 11, gridRow: 2 }} onClick={() => onSpecial('handakuten')}>゜</button>
      <button className="kb-key fn" style={{ gridColumn: 11, gridRow: 3 }} onClick={() => onChar('ー')}>ー</button>
      <button className="kb-key fn del" style={{ gridColumn: 11, gridRow: '4 / span 2' }} onClick={() => onSpecial('back')}>⌫</button>
    </div>
  )
}
