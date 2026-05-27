import { TOOLS } from '../data/tools.js'

export default function ToolPicker({ value = [], onChange }) {
  function toggle(t) {
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t])
  }
  return (
    <div className="chips">
      {TOOLS.map((t) => (
        <button
          type="button"
          key={t}
          className={`chip ${value.includes(t) ? 'chip--active' : ''}`}
          onClick={() => toggle(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
