// On-screen hiragana (gojūon) keyboard for kids who can't type yet.
const ROWS = [
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
      {ROWS.map((row, i) => (
        <div className="kb-row" key={i}>
          {row.map((ch) => (
            <button key={ch} className="kb-key" onClick={() => onChar(ch)}>{ch}</button>
          ))}
        </div>
      ))}
      <div className="kb-row">
        <button className="kb-key" onClick={() => onSpecial('dakuten')}>゛</button>
        <button className="kb-key" onClick={() => onSpecial('handakuten')}>゜</button>
        <button className="kb-key" onClick={() => onChar('ー')}>ー</button>
        <button className="kb-key wide" onClick={() => onSpecial('back')}>← けす</button>
      </div>
    </div>
  )
}
