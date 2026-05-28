import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1600)
    const t2 = setTimeout(onDone, 2150)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div className={`splash ${leaving ? 'splash--leave' : ''}`}>
      <div className="splash-inner">
        <div className="splash-glow" />
        <svg className="splash-mark" viewBox="0 0 32 32" width="84" height="84" aria-hidden="true">
          <defs>
            <linearGradient id="lgS" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#a78bfa" />
              <stop offset="1" stop-color="#7c3aed" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill="url(#lgS)" />
          <path d="M15 5.5 L17 13 L24.5 15 L17 17 L15 24.5 L13 17 L5.5 15 L13 13 Z" fill="#fff" />
          <circle cx="23" cy="9" r="2" fill="#fff" opacity="0.85" />
        </svg>
        <span className="splash-name">Prompt&nbsp;Studio</span>
      </div>
    </div>
  )
}
