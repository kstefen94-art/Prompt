import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1500)
    const t2 = setTimeout(onDone, 2050)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  return (
    <div className={`splash ${leaving ? 'splash--leave' : ''}`}>
      <div className="splash-inner">
        <div className="splash-glow" />
        <img className="splash-logo-img" src="./logo.png" alt="AIShowcase" />
      </div>
    </div>
  )
}
