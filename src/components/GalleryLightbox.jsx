import { useEffect, useState } from 'react'
import { downloadUrl } from '../lib/download.js'

function Media({ item }) {
  if (item.type === 'video') {
    return <video className="lb-media" src={item.src} controls playsInline />
  }
  return <img className="lb-media" src={item.src} alt="" />
}

export default function GalleryLightbox({ work, favorite, onToggleFav, onClose, canEdit, onDelete, onEdit }) {
  const [idx, setIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const count = work.media.length

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % count)
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + count) % count)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, count])

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(work.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lightbox" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <div className="lb-stage">
          <Media item={work.media[idx]} />
          {count > 1 && (
            <>
              <button
                className="lb-nav lb-prev"
                onClick={() => setIdx((i) => (i - 1 + count) % count)}
                aria-label="이전"
              >
                ‹
              </button>
              <button
                className="lb-nav lb-next"
                onClick={() => setIdx((i) => (i + 1) % count)}
                aria-label="다음"
              >
                ›
              </button>
              <span className="lb-counter">
                {idx + 1} / {count}
              </span>
            </>
          )}
        </div>

        <div className="lb-side">
          <div className="lb-meta">
            <span>NO. {work.no}</span>
            <button
              className={`icon-btn ${favorite ? 'icon-btn--fav' : ''}`}
              onClick={() => onToggleFav(work.no)}
              aria-label="즐겨찾기"
            >
              {favorite ? '♥' : '♡'}
            </button>
          </div>
          <h2 className="lb-title">{work.title}</h2>
          <div className="photo-tags">
            {work.categories.map((c) => (
              <span key={c} className="cat-tag">{c}</span>
            ))}
            {(work.tools || []).map((t) => (
              <span key={t} className="tool-tag">🛠 {t}</span>
            ))}
          </div>
          <button
            className="download-btn"
            onClick={() => downloadUrl(work.media[idx].src, `${work.title || 'image'}-${idx + 1}`)}
          >
            ⬇ 이 사진 다운로드
          </button>

          <div className="lb-prompt-head">
            <span>프롬프트</span>
            <button className="mini-copy" onClick={copyPrompt}>
              {copied ? '복사됨 ✓' : '복사'}
            </button>
          </div>
          <pre className="lb-prompt">{work.prompt}</pre>
          {canEdit && (
            <div className="lb-edit-actions">
              <button className="edit-btn" onClick={onEdit}>
                수정
              </button>
              <button className="delete-btn" onClick={onDelete}>
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
