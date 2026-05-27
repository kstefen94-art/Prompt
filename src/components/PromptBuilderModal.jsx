import { useEffect, useMemo, useState } from 'react'
import { extractVars, fillTemplate } from '../data/templates.js'

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function PromptBuilderModal({ template, onClose }) {
  const vars = useMemo(() => extractVars(template.template), [template])
  const [values, setValues] = useState(() =>
    Object.fromEntries(vars.map((v) => [v, ''])),
  )
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

  const result = fillTemplate(template.template, values)
  const filledCount = vars.filter((v) => values[v]?.trim()).length

  function update(key, value) {
    setValues((s) => ({ ...s, [key]: value }))
  }

  function randomFill() {
    setValues(
      Object.fromEntries(
        vars.map((v) => {
          const examples = template.variables[v] || []
          return [v, examples.length ? randomFrom(examples) : values[v]]
        }),
      ),
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="builder-head">
          <h2>✨ 프롬프트 빌더</h2>
          <p>{template.title}</p>
        </div>

        <div className="builder-intro">
          <span>각 변수에 원하는 값을 입력하면 완성된 프롬프트가 생성됩니다.</span>
          <button className="random-btn" onClick={randomFill}>
            ✨ 랜덤 예시 채우기 🎲
          </button>
        </div>

        <div className="builder-fields">
          {vars.map((v) => (
            <div key={v} className="field">
              <label className="var-name" htmlFor={`f-${v}`}>{`{${v}}`}</label>
              <input
                id={`f-${v}`}
                value={values[v]}
                onChange={(e) => update(v, e.target.value)}
                placeholder={`${v.toLowerCase().replace(/_/g, ' ')}을(를) 입력하세요…`}
              />
            </div>
          ))}
        </div>

        <div className="builder-result">
          <div className="preview-head">
            <h3>생성된 프롬프트</h3>
            <span className="counter">
              {filledCount}/{vars.length} 입력
            </span>
          </div>
          <pre className="result-box">{result}</pre>
          <button className="builder-btn full" onClick={copy}>
            {copied ? '복사됨 ✓' : '프롬프트 복사'}
          </button>
        </div>
      </div>
    </div>
  )
}
