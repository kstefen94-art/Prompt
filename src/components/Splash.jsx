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
          <img className="splash-logo-img" src="./logo.png" alt="AIShowcase" />
        </div>
      )}
    </div>
  )
}
