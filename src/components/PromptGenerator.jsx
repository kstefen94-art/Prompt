import { useMemo, useState } from 'react'

const TONES = ['전문적', '친근함', '간결함', '설득력 있게', '유머러스']
const FORMATS = [
  '제한 없음',
  '글머리표 목록',
  '번호 매긴 단계',
  '표(Markdown)',
  'JSON',
  '에세이/문단',
]

const PRESETS = {
  '직접 입력': null,
  '블로그 작가': {
    role: '숙련된 콘텐츠 마케터이자 카피라이터',
    task: '주어진 주제로 SEO에 강한 블로그 글의 구조와 초안을 작성한다',
    context: '타깃 독자는 해당 분야에 막 입문한 사람들이다',
    constraints: '전문 용어는 쉽게 풀어서 설명할 것\n1500자 내외',
    format: '번호 매긴 단계',
    tone: '친근함',
    audience: '입문자',
  },
  '코드 리뷰어': {
    role: '15년 경력의 시니어 소프트웨어 엔지니어',
    task: '제출된 코드를 리뷰하고 개선점을 제안한다',
    context: '코드의 정확성, 가독성, 성능, 보안 관점에서 검토한다',
    constraints: '각 지적사항에 우선순위(높음/중간/낮음)를 표시할 것\n수정 코드 예시를 함께 제시할 것',
    format: '글머리표 목록',
    tone: '전문적',
    audience: '동료 개발자',
  },
  '학습 튜터': {
    role: '인내심 많은 1:1 튜터',
    task: '학습자가 개념을 스스로 이해하도록 단계적으로 이끈다',
    context: '소크라테스식 질문법을 사용한다',
    constraints: '정답을 바로 알려주지 말 것\n한 번에 하나의 질문만 할 것',
    format: '제한 없음',
    tone: '친근함',
    audience: '학생',
  },
}

const initialState = {
  role: '',
  task: '',
  context: '',
  audience: '',
  constraints: '',
  examples: '',
  format: '제한 없음',
  tone: '전문적',
  language: '한국어',
  stepByStep: false,
  noGuess: false,
}

function buildPrompt(s) {
  const lines = []

  if (s.role.trim()) {
    lines.push(`당신은 ${s.role.trim()}입니다.`)
  }

  if (s.task.trim()) {
    lines.push('', `# 목표`, s.task.trim())
  }

  if (s.context.trim()) {
    lines.push('', `# 배경/맥락`, s.context.trim())
  }

  if (s.audience.trim()) {
    lines.push('', `# 대상 독자`, s.audience.trim())
  }

  const constraintList = s.constraints
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const extraConstraints = []
  if (s.stepByStep)
    extraConstraints.push('답하기 전에 단계별로 차근차근 생각할 것')
  if (s.noGuess)
    extraConstraints.push('확실하지 않은 내용은 추측하지 말고 모른다고 답할 것')
  const allConstraints = [...constraintList, ...extraConstraints]
  if (allConstraints.length) {
    lines.push('', `# 제약 조건`)
    allConstraints.forEach((c) => lines.push(`- ${c}`))
  }

  if (s.examples.trim()) {
    lines.push('', `# 예시`, s.examples.trim())
  }

  const meta = []
  if (s.format && s.format !== '제한 없음')
    meta.push(`출력 형식: ${s.format}`)
  if (s.tone) meta.push(`말투/톤: ${s.tone}`)
  if (s.language) meta.push(`답변 언어: ${s.language}`)
  if (meta.length) {
    lines.push('', `# 출력 지침`)
    meta.forEach((m) => lines.push(`- ${m}`))
  }

  return lines.join('\n').trim()
}

export default function PromptGenerator() {
  const [state, setState] = useState(initialState)
  const [preset, setPreset] = useState('직접 입력')
  const [copied, setCopied] = useState(false)

  const generated = useMemo(() => buildPrompt(state), [state])

  function update(key, value) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function applyPreset(name) {
    setPreset(name)
    const p = PRESETS[name]
    if (!p) {
      setState(initialState)
      return
    }
    setState({ ...initialState, ...p })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="gen">
      <div className="gen-form">
        <div className="field">
          <label>템플릿 프리셋</label>
          <div className="chips">
            {Object.keys(PRESETS).map((name) => (
              <button
                key={name}
                className={`chip ${preset === name ? 'chip--active' : ''}`}
                onClick={() => applyPreset(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="role">역할 (누구처럼 행동할까요?)</label>
          <input
            id="role"
            value={state.role}
            onChange={(e) => update('role', e.target.value)}
            placeholder="예: 숙련된 마케팅 카피라이터"
          />
        </div>

        <div className="field">
          <label htmlFor="task">작업 / 목표 *</label>
          <textarea
            id="task"
            rows={2}
            value={state.task}
            onChange={(e) => update('task', e.target.value)}
            placeholder="예: 신제품 출시를 알리는 인스타그램 게시글을 작성한다"
          />
        </div>

        <div className="field">
          <label htmlFor="context">배경 / 맥락</label>
          <textarea
            id="context"
            rows={2}
            value={state.context}
            onChange={(e) => update('context', e.target.value)}
            placeholder="예: 20대 여성을 타깃으로 하는 친환경 화장품 브랜드"
          />
        </div>

        <div className="field">
          <label htmlFor="audience">대상 독자</label>
          <input
            id="audience"
            value={state.audience}
            onChange={(e) => update('audience', e.target.value)}
            placeholder="예: 20대 직장인"
          />
        </div>

        <div className="field">
          <label htmlFor="constraints">제약 조건 (한 줄에 하나씩)</label>
          <textarea
            id="constraints"
            rows={3}
            value={state.constraints}
            onChange={(e) => update('constraints', e.target.value)}
            placeholder={'예: 이모지를 3개 이하로 사용\n200자 이내로 작성'}
          />
        </div>

        <div className="field">
          <label htmlFor="examples">예시 (선택)</label>
          <textarea
            id="examples"
            rows={2}
            value={state.examples}
            onChange={(e) => update('examples', e.target.value)}
            placeholder="원하는 결과물의 예시를 붙여넣으면 품질이 올라갑니다"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="format">출력 형식</label>
            <select
              id="format"
              value={state.format}
              onChange={(e) => update('format', e.target.value)}
            >
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="language">답변 언어</label>
            <select
              id="language"
              value={state.language}
              onChange={(e) => update('language', e.target.value)}
            >
              <option>한국어</option>
              <option>영어</option>
              <option>일본어</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>톤 / 말투</label>
          <div className="chips">
            {TONES.map((t) => (
              <button
                key={t}
                className={`chip ${state.tone === t ? 'chip--active' : ''}`}
                onClick={() => update('tone', t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="checks">
          <label className="check">
            <input
              type="checkbox"
              checked={state.stepByStep}
              onChange={(e) => update('stepByStep', e.target.checked)}
            />
            단계별로 사고하도록 지시 (Chain of Thought)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={state.noGuess}
              onChange={(e) => update('noGuess', e.target.checked)}
            />
            모르는 건 추측하지 않도록 지시
          </label>
        </div>

        <button className="link-btn" onClick={() => applyPreset('직접 입력')}>
          전체 초기화
        </button>
      </div>

      <div className="gen-preview">
        <div className="preview-head">
          <h3>생성된 프롬프트</h3>
          <button
            className="copy-btn"
            onClick={copy}
            disabled={!generated}
          >
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>
        {generated ? (
          <pre className="preview-body">{generated}</pre>
        ) : (
          <div className="preview-empty">
            왼쪽에서 작업/목표를 입력하면 여기에 프롬프트가 실시간으로
            만들어집니다.
          </div>
        )}
      </div>
    </div>
  )
}
