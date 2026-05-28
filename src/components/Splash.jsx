import { useEffect, useState } from 'react'

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  const [useVideo, setUseVideo] = useState(true)

  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  // 영상 파일을 public/ 에 넣으면 자동 사용됨 (없으면 로고 폴백)
  const src = isMobile ? './splash-mobile.mp4' : './splash-web.mp4'

  function finish() {
    setLeaving(true)
    setTimeout(onDone, 550)
  }

  useEffect(() => {
    // 영상이 안 끝나거나 막히면 안전장치로 진행 (영상: 9초 / 폴백 로고: 1.9초)
    const t = setTimeout(finish, useVideo ? 9000 : 1900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useVideo])

  return (
    <div className={`splash ${leaving ? 'splash--leave' : ''}`}>
      {useVideo ? (
        <video
          className="splash-video"
          src={src}
          autoPlay
          muted
          playsInline
          onEnded={finish}
          onError={() => setUseVideo(false)}
        />
      ) : (
        <div className="splash-inner">
          <div className="splash-glow" />
          <svg className="splash-mark" viewBox="0 0 40 40" width="92" height="92" aria-hidden="true">
            <defs>
              <linearGradient id="lgS" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#c4b5fd" />
                <stop offset="0.5" stop-color="#8b5cf6" />
                <stop offset="1" stop-color="#6d28d9" />
              </linearGradient>
              <radialGradient id="glS" cx="50%" cy="45%" r="55%">
                <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
                <stop offset="1" stop-color="#fff" stop-opacity="0" />
              </radialGradient>
            </defs>
            <rect width="40" height="40" rx="11" fill="url(#lgS)" />
            <circle cx="20" cy="18" r="14" fill="url(#glS)" />
            <path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z" fill="#fff" />
            <path d="M31 8 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z" fill="#fff" opacity="0.9" />
          </svg>
          <span className="splash-name"><span className="brand-ai">AI</span>Showcase</span>
        </div>
      )}
    </div>
  )
}
