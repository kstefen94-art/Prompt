import { useEffect, useState } from 'react'

export default function PromptModal({ prompt, onClose }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={prompt.title}
      >
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="card-top">
          <span className="tag">{prompt.category}</span>
          {prompt.model && <span className="model">{prompt.model}</span>}
        </div>
        <h2 className="modal-title">{prompt.title}</h2>
        <p className="card-desc">{prompt.description}</p>
        <div className="tags">
          {(prompt.tags || []).map((t) => (
            <span key={t} className="mini-tag">
              #{t}
            </span>
          ))}
        </div>
        <pre className="modal-prompt">{prompt.prompt}</pre>
        <button className="copy-btn copy-btn--lg" onClick={copy}>
          {copied ? '복사됨 ✓' : '프롬프트 복사'}
        </button>
      </div>
    </div>
  )
}
