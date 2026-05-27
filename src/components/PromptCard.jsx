import { useState } from 'react'

export default function PromptCard({ prompt, onOpen }) {
  const [copied, setCopied] = useState(false)

  async function copy(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className="card" onClick={onOpen}>
      <div className="card-top">
        <span className="tag">{prompt.category}</span>
        {prompt.model && <span className="model">{prompt.model}</span>}
      </div>
      <h3 className="card-title">{prompt.title}</h3>
      <p className="card-desc">{prompt.description}</p>
      <pre className="card-prompt">{prompt.prompt}</pre>
      <div className="card-foot">
        <div className="tags">
          {(prompt.tags || []).map((t) => (
            <span key={t} className="mini-tag">
              #{t}
            </span>
          ))}
        </div>
        <button className="copy-btn" onClick={copy}>
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
    </article>
  )
}
