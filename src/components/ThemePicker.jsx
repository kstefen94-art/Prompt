import { useState } from 'react'
import { THEMES, applyTheme, loadTheme } from '../lib/theme.js'

export default function ThemePicker() {
  const [cur, setCur] = useState(loadTheme())

  function pick(id) {
    applyTheme(id)
    setCur(id)
  }

  return (
    <div className="theme-kit">
      <h3 className="drafts-title">디자인 테마</h3>
      <p className="hint">
        누르면 사이트 전체에 바로 적용돼요. 마음에 드는 걸 고른 뒤 알려주시면, 그 방향으로 더
        다듬어 드립니다.
      </p>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            className={`theme-card ${cur === t.id ? 'on' : ''}`}
            onClick={() => pick(t.id)}
          >
            <span className="theme-swatch">
              <span style={{ background: t.swatch[0] }} />
              <span style={{ background: t.swatch[1] }} />
            </span>
            <span className="theme-name">{t.name}</span>
            <span className="theme-desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
