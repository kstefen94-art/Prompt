import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1300)
    const t2 = setTimeout(onDone, 1850)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div className={`splash ${leaving ? 'splash--leave' : ''}`}>
      <div className="splash-logo">
        <svg viewBox="0 0 32 32" width="74" height="74" aria-hidden="true">
          <rect width="32" height="32" rx="9" fill="#8b5cf6" />
          <path
            d="M16 6.2 L18.4 13.6 L25.8 16 L18.4 18.4 L16 25.8 L13.6 18.4 L6.2 16 L13.6 13.6 Z"
            fill="#fff"
          />
        </svg>
        <span className="splash-name">Prompt&nbsp;Studio</span>
      </div>
    </div>
  )
}
