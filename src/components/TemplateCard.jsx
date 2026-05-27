import { useState } from 'react'
import { extractVars, fillTemplate } from '../data/templates.js'

const LEVEL_CLASS = { 초급: 'lv-beginner', 중급: 'lv-inter', 고급: 'lv-adv' }

export default function TemplateCard({ template, onOpenBuilder, onViewWorks }) {
  const [copied, setCopied] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const vars = extractVars(template.template)

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template.template)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  // 예시: 각 변수의 첫 번째 예시 값으로 채운 완성 프롬프트
  const exampleValues = Object.fromEntries(
    vars.map((v) => [v, (template.variables[v] || [''])[0]]),
  )
  const exampleText = fillTemplate(template.template, exampleValues)

  return (
    <article className="tpl-card">
      <div className="tpl-head">
        <h3 className="tpl-title">{template.title}</h3>
        <span className={`level ${LEVEL_CLASS[template.level] || ''}`}>
          {template.level}
        </span>
      </div>
      <p className="tpl-desc">{template.description}</p>

      <div className="code-block">
        <button
          className="code-copy"
          onClick={copyTemplate}
          aria-label="템플릿 복사"
        >
          {copied ? '✓' : '⧉'}
        </button>
        <code>{template.template}</code>
      </div>

      <div className="var-chips">
        {vars.map((v) => (
          <span key={v} className="var-chip">{`{${v}}`}</span>
        ))}
      </div>

      {showExample && (
        <div className="example-box">
          <span className="example-label">예시</span>
          <p>{exampleText}</p>
        </div>
      )}

      <div className="tpl-actions">
        <button
          className="example-toggle"
          onClick={() => setShowExample((s) => !s)}
        >
          예시 보기 {showExample ? '▲' : '▼'}
        </button>
        <button className="builder-btn" onClick={() => onOpenBuilder(template)}>
          ✨ 프롬프트 빌더
        </button>
        <button className="works-link" onClick={() => onViewWorks(template.id)}>
          이 패턴 작품 보기 →
        </button>
      </div>
    </article>
  )
}
