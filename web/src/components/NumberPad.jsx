// On-screen number pad for entering the 4-digit PIN.
export default function NumberPad({ onDigit, onBack }) {
  return (
    <div className="pad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} className="pad-key" onClick={() => onDigit(d)}>{d}</button>
      ))}
      <button className="pad-key" onClick={onBack}>←</button>
      <button className="pad-key" onClick={() => onDigit('0')}>0</button>
      <span />
    </div>
  )
}
