import { useEffect, useMemo, useRef, useState } from 'react'

const TONES = ['전문적', '친근함', '간결함', '설득력 있게', '유머러스']
const FORMATS = [
  '제한 없음',
  '글머리표 목록',
  '번호 매긴 단계',
  '표(Markdown)',
  'JSON',
  '에세이/문단',
]
const LANGS = ['한국어', '영어', '일본어']

// 자동 생성에서 고르는 용도. 각 유형마다 역할/형식/제약을 자동으로 채웁니다.
const TYPES = {
  '일반': {
    role: '해당 주제에 정통한 전문가',
    format: '제한 없음',
    extra: [],
  },
  '글쓰기/블로그': {
    role: '숙련된 콘텐츠 마케터이자 카피라이터',
    format: '번호 매긴 단계',
    extra: ['제목 후보를 3개 제시할 것', '도입부는 독자의 흥미를 끌 것'],
  },
  '코딩/개발': {
    role: '15년 경력의 시니어 소프트웨어 엔지니어',
    format: '글머리표 목록',
    extra: ['코드 예시를 함께 제시할 것', '엣지 케이스와 예외 처리를 고려할 것'],
  },
  '이미지 생성': {
    role: '비주얼 아트 디렉터',
    format: '제한 없음',
    extra: [
      '피사체·배경·조명·화풍·분위기를 구체적으로 묘사할 것',
      '최종 결과는 영어 한 줄 프롬프트로 정리할 것',
    ],
  },
  '마케팅/카피': {
    role: '전환율 최적화에 능한 퍼포먼스 마케터',
    format: '글머리표 목록',
    extra: ['타깃 고객의 감정을 자극할 것', '명확한 행동 유도(CTA)를 포함할 것'],
  },
  '학습/설명': {
    role: '복잡한 개념을 쉽게 풀어주는 1:1 튜터',
    format: '번호 매긴 단계',
    extra: ['쉬운 비유를 사용할 것', '이해를 확인하는 질문으로 마무리할 것'],
  },
  '요약/분석': {
    role: '핵심을 빠르게 짚어내는 분석가',
    format: '글머리표 목록',
    extra: ['핵심 3줄 요약을 먼저 제시할 것', '근거가 되는 부분을 함께 표시할 것'],
  },
  '챗봇 페르소나': {
    role: '일관된 성격을 가진 대화형 AI 캐릭터',
    format: '제한 없음',
    extra: ['말투와 성격을 일관되게 유지할 것', '역할에서 벗어나지 말 것'],
  },
}

// ---------- 무료 내장 생성기 (규칙 기반) ----------
function quickGenerate({ idea, type, tone, language, stepByStep }) {
  const t = TYPES[type] || TYPES['일반']
  const lines = []
  lines.push(`당신은 ${t.role}입니다.`)
  lines.push('', '# 목표', idea.trim() || '(여기에 목표를 입력하세요)')

  const constraints = [...t.extra]
  if (stepByStep) constraints.push('답하기 전에 단계별로 차근차근 생각할 것')
  constraints.push('불확실한 내용은 추측하지 말고 모른다고 밝힐 것')
  if (constraints.length) {
    lines.push('', '# 제약 조건')
    constraints.forEach((c) => lines.push(`- ${c}`))
  }

  lines.push('', '# 출력 지침')
  if (t.format !== '제한 없음') lines.push(`- 출력 형식: ${t.format}`)
  lines.push(`- 말투/톤: ${tone}`)
  lines.push(`- 답변 언어: ${language}`)

  return lines.join('\n').trim()
}

// ---------- 직접 빌드 ----------
const initialBuild = {
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
  if (s.role.trim()) lines.push(`당신은 ${s.role.trim()}입니다.`)
  if (s.task.trim()) lines.push('', '# 목표', s.task.trim())
  if (s.context.trim()) lines.push('', '# 배경/맥락', s.context.trim())
  if (s.audience.trim()) lines.push('', '# 대상 독자', s.audience.trim())

  const list = s.constraints.split('\n').map((l) => l.trim()).filter(Boolean)
  if (s.stepByStep) list.push('답하기 전에 단계별로 차근차근 생각할 것')
  if (s.noGuess) list.push('확실하지 않은 내용은 추측하지 말고 모른다고 답할 것')
  if (list.length) {
    lines.push('', '# 제약 조건')
    list.forEach((c) => lines.push(`- ${c}`))
  }

  if (s.examples.trim()) lines.push('', '# 예시', s.examples.trim())

  const meta = []
  if (s.format && s.format !== '제한 없음') meta.push(`출력 형식: ${s.format}`)
  if (s.tone) meta.push(`말투/톤: ${s.tone}`)
  if (s.language) meta.push(`답변 언어: ${s.language}`)
  if (meta.length) {
    lines.push('', '# 출력 지침')
    meta.forEach((m) => lines.push(`- ${m}`))
  }
  return lines.join('\n').trim()
}

// ---------- Ollama 연동 ----------
const DEFAULT_OLLAMA = { baseUrl: 'http://localhost:11434', model: 'llama3.1' }

function loadOllama() {
  try {
    const saved = JSON.parse(localStorage.getItem('ollama_settings'))
    return { ...DEFAULT_OLLAMA, ...saved }
  } catch {
    return DEFAULT_OLLAMA
  }
}

function buildMetaPrompt({ idea, type, tone, language }) {
  const t = TYPES[type] || TYPES['일반']
  return `You are an expert prompt engineer. Write a single, high-quality, ready-to-use prompt for a large language model based on the request below.

Request: ${idea}
Domain/role to assume: ${t.role}
Desired tone: ${tone}
The final prompt MUST be written in: ${language}

Guidelines:
- Make the prompt clear, specific, and well-structured (role, goal, constraints, output format).
- Include only the final prompt. Do NOT add explanations, commentary, or markdown code fences.
- Do not answer the request yourself; only produce the prompt that someone would give to an AI.`
}

async function streamOllama({ baseUrl, model, metaPrompt, onToken, signal }) {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: metaPrompt, stream: true }),
    signal,
  })
  if (!res.ok) {
    throw new Error(`Ollama 응답 오류 (HTTP ${res.status}). 모델 이름이 맞는지 확인하세요.`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop()
    for (const line of parts) {
      const text = line.trim()
      if (!text) continue
      let obj
      try {
        obj = JSON.parse(text)
      } catch {
        continue
      }
      if (obj.error) throw new Error(obj.error)
      if (obj.response) {
        full += obj.response
        onToken(full)
      }
    }
  }
  return full.trim()
}

export default function PromptGenerator() {
  const [mode, setMode] = useState('auto') // 'auto' | 'build'

  // 자동 생성 상태
  const [idea, setIdea] = useState('')
  const [type, setType] = useState('일반')
  const [autoTone, setAutoTone] = useState('전문적')
  const [autoLang, setAutoLang] = useState('한국어')
  const [stepByStep, setStepByStep] = useState(true)
  const [autoResult, setAutoResult] = useState('')

  // 직접 빌드 상태
  const [build, setBuild] = useState(initialBuild)

  // Ollama 상태
  const [ollama, setOllama] = useState(loadOllama)
  const [ollamaOpen, setOllamaOpen] = useState(false)
  const [conn, setConn] = useState({ status: 'idle', msg: '' }) // idle|ok|error|testing
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const abortRef = useRef(null)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem('ollama_settings', JSON.stringify(ollama))
  }, [ollama])

  const built = useMemo(() => buildPrompt(build), [build])
  const preview = mode === 'build' ? built : autoResult

  function updateBuild(key, value) {
    setBuild((s) => ({ ...s, [key]: value }))
  }

  function handleQuick() {
    setGenError('')
    setAutoResult(quickGenerate({ idea, type, tone: autoTone, language: autoLang, stepByStep }))
  }

  async function testConnection() {
    setConn({ status: 'testing', msg: '연결 확인 중…' })
    try {
      const res = await fetch(`${ollama.baseUrl.replace(/\/$/, '')}/api/tags`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const names = (data.models || []).map((m) => m.name)
      setConn({
        status: 'ok',
        msg: names.length
          ? `연결됨 · 설치된 모델: ${names.join(', ')}`
          : '연결됨 · 설치된 모델이 없습니다. `ollama pull llama3.1` 로 받으세요.',
      })
    } catch (e) {
      setConn({
        status: 'error',
        msg: `연결 실패: ${e.message}. Ollama가 실행 중인지, CORS(OLLAMA_ORIGINS) 설정을 확인하세요.`,
      })
    }
  }

  async function handleAiGenerate() {
    if (!idea.trim()) {
      setGenError('먼저 무엇을 위한 프롬프트인지 입력하세요.')
      return
    }
    setGenError('')
    setGenerating(true)
    setAutoResult('')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamOllama({
        baseUrl: ollama.baseUrl,
        model: ollama.model,
        metaPrompt: buildMetaPrompt({ idea, type, tone: autoTone, language: autoLang }),
        onToken: (full) => setAutoResult(full),
        signal: controller.signal,
      })
    } catch (e) {
      if (e.name !== 'AbortError') {
        setGenError(
          `${e.message} — Ollama 미실행/모델 미설치/브라우저 보안 문제일 수 있습니다. 아래 "Ollama 설정"에서 연결을 테스트해 보세요.`,
        )
      }
    } finally {
      setGenerating(false)
      abortRef.current = null
    }
  }

  function stopGenerate() {
    abortRef.current?.abort()
  }

  async function copy() {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="gen">
      <div className="gen-form">
        <div className="seg">
          <button
            className={`seg-btn ${mode === 'auto' ? 'seg-btn--active' : ''}`}
            onClick={() => setMode('auto')}
          >
            ⚡ 자동 생성
          </button>
          <button
            className={`seg-btn ${mode === 'build' ? 'seg-btn--active' : ''}`}
            onClick={() => setMode('build')}
          >
            🛠 직접 빌드
          </button>
        </div>

        {mode === 'auto' && (
          <>
            <div className="field">
              <label htmlFor="idea">무엇을 위한 프롬프트인가요?</label>
              <textarea
                id="idea"
                rows={3}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="예: 신제품 출시를 알리는 인스타그램 게시글을 써주는 프롬프트"
              />
            </div>

            <div className="field">
              <label htmlFor="type">유형</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.keys(TYPES).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="autoLang">언어</label>
                <select
                  id="autoLang"
                  value={autoLang}
                  onChange={(e) => setAutoLang(e.target.value)}
                >
                  {LANGS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="autoTone">톤</label>
                <select
                  id="autoTone"
                  value={autoTone}
                  onChange={(e) => setAutoTone(e.target.value)}
                >
                  {TONES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="check">
              <input
                type="checkbox"
                checked={stepByStep}
                onChange={(e) => setStepByStep(e.target.checked)}
              />
              단계별로 사고하도록 지시 (Chain of Thought)
            </label>

            <div className="gen-actions">
              <button className="btn-ghost" onClick={handleQuick} disabled={generating}>
                빠른 생성 (무료)
              </button>
              {generating ? (
                <button className="btn-primary" onClick={stopGenerate}>
                  ■ 중지
                </button>
              ) : (
                <button className="btn-primary" onClick={handleAiGenerate}>
                  🤖 AI로 생성 (Ollama)
                </button>
              )}
            </div>

            {genError && <p className="error-text">{genError}</p>}

            <div className="ollama-box">
              <button
                className="ollama-head"
                onClick={() => setOllamaOpen((o) => !o)}
              >
                <span>Ollama 설정 {ollamaOpen ? '▲' : '▼'}</span>
                <span className={`dot dot--${conn.status}`} />
              </button>
              {ollamaOpen && (
                <div className="ollama-body">
                  <div className="field">
                    <label htmlFor="ourl">서버 주소</label>
                    <input
                      id="ourl"
                      value={ollama.baseUrl}
                      onChange={(e) =>
                        setOllama((o) => ({ ...o, baseUrl: e.target.value }))
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="omodel">모델 이름</label>
                    <input
                      id="omodel"
                      value={ollama.model}
                      onChange={(e) =>
                        setOllama((o) => ({ ...o, model: e.target.value }))
                      }
                      placeholder="예: llama3.1, qwen2.5, gemma2"
                    />
                  </div>
                  <button className="btn-ghost" onClick={testConnection}>
                    연결 테스트
                  </button>
                  {conn.msg && (
                    <p className={`conn-msg conn-msg--${conn.status}`}>{conn.msg}</p>
                  )}
                  <p className="hint">
                    로컬에 Ollama를 설치하고 <code>ollama serve</code> 로 실행하세요.
                    배포된 사이트(https)에서 호출하려면 Ollama를{' '}
                    <code>OLLAMA_ORIGINS=* ollama serve</code> 로 켜야 합니다.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {mode === 'build' && (
          <>
            <div className="field">
              <label htmlFor="role">역할 (누구처럼 행동할까요?)</label>
              <input
                id="role"
                value={build.role}
                onChange={(e) => updateBuild('role', e.target.value)}
                placeholder="예: 숙련된 마케팅 카피라이터"
              />
            </div>
            <div className="field">
              <label htmlFor="task">작업 / 목표 *</label>
              <textarea
                id="task"
                rows={2}
                value={build.task}
                onChange={(e) => updateBuild('task', e.target.value)}
                placeholder="예: 신제품 출시를 알리는 인스타그램 게시글을 작성한다"
              />
            </div>
            <div className="field">
              <label htmlFor="context">배경 / 맥락</label>
              <textarea
                id="context"
                rows={2}
                value={build.context}
                onChange={(e) => updateBuild('context', e.target.value)}
                placeholder="예: 20대 여성을 타깃으로 하는 친환경 화장품 브랜드"
              />
            </div>
            <div className="field">
              <label htmlFor="audience">대상 독자</label>
              <input
                id="audience"
                value={build.audience}
                onChange={(e) => updateBuild('audience', e.target.value)}
                placeholder="예: 20대 직장인"
              />
            </div>
            <div className="field">
              <label htmlFor="constraints">제약 조건 (한 줄에 하나씩)</label>
              <textarea
                id="constraints"
                rows={3}
                value={build.constraints}
                onChange={(e) => updateBuild('constraints', e.target.value)}
                placeholder={'예: 이모지를 3개 이하로 사용\n200자 이내로 작성'}
              />
            </div>
            <div className="field">
              <label htmlFor="examples">예시 (선택)</label>
              <textarea
                id="examples"
                rows={2}
                value={build.examples}
                onChange={(e) => updateBuild('examples', e.target.value)}
                placeholder="원하는 결과물의 예시를 붙여넣으면 품질이 올라갑니다"
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="format">출력 형식</label>
                <select
                  id="format"
                  value={build.format}
                  onChange={(e) => updateBuild('format', e.target.value)}
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
                  value={build.language}
                  onChange={(e) => updateBuild('language', e.target.value)}
                >
                  {LANGS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label>톤 / 말투</label>
              <div className="chips">
                {TONES.map((t) => (
                  <button
                    key={t}
                    className={`chip ${build.tone === t ? 'chip--active' : ''}`}
                    onClick={() => updateBuild('tone', t)}
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
                  checked={build.stepByStep}
                  onChange={(e) => updateBuild('stepByStep', e.target.checked)}
                />
                단계별로 사고하도록 지시 (Chain of Thought)
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={build.noGuess}
                  onChange={(e) => updateBuild('noGuess', e.target.checked)}
                />
                모르는 건 추측하지 않도록 지시
              </label>
            </div>
            <button className="link-btn" onClick={() => setBuild(initialBuild)}>
              전체 초기화
            </button>
          </>
        )}
      </div>

      <div className="gen-preview">
        <div className="preview-head">
          <h3>{generating ? '생성 중…' : '생성된 프롬프트'}</h3>
          <button className="copy-btn" onClick={copy} disabled={!preview}>
            {copied ? '복사됨 ✓' : '복사'}
          </button>
        </div>
        {preview ? (
          <pre className="preview-body">
            {preview}
            {generating && <span className="caret">▍</span>}
          </pre>
        ) : (
          <div className="preview-empty">
            {mode === 'auto'
              ? '아이디어를 입력하고 "빠른 생성" 또는 "AI로 생성"을 눌러보세요.'
              : '왼쪽에서 작업/목표를 입력하면 여기에 프롬프트가 실시간으로 만들어집니다.'}
          </div>
        )}
      </div>
    </div>
  )
}
