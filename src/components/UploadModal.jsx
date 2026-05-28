import { useEffect, useState } from 'react'
import { templates } from '../data/templates.js'
import { CATEGORIES } from '../data/categories.js'
import { addWork } from '../lib/galleryApi.js'
import ToolPicker from './ToolPicker.jsx'

export default function UploadModal({ userId, onClose, onDone }) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [tools, setTools] = useState([])
  const [templateId, setTemplateId] = useState('')
  const [prompt, setPrompt] = useState('')
  // 고른 파일 목록: { id, file, url(미리보기), isVideo }
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, busy])

  // 컴포넌트 종료 시 미리보기 URL 정리
  useEffect(() => {
    return () => items.forEach((it) => URL.revokeObjectURL(it.url))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function addFiles(e) {
    const picked = [...e.target.files]
    e.target.value = '' // 같은 파일 다시 고를 수 있게 초기화
    setItems((prev) => [
      ...prev,
      ...picked.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isVideo: file.type.startsWith('video'),
      })),
    ])
  }

  function removeItem(id) {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id)
      if (target) URL.revokeObjectURL(target.url)
      return prev.filter((it) => it.id !== id)
    })
  }

  async function submit() {
    if (!title.trim()) return setError('제목을 입력하세요.')
    if (!items.length) return setError('올릴 이미지/영상을 1개 이상 선택하세요.')
    setError('')
    setBusy(true)
    try {
      await addWork(
        {
          title: title.trim(),
          categories: category ? [category] : [],
          tools,
          templateId,
          prompt: prompt.trim(),
          files: items.map((it) => it.file),
        },
        userId,
      )
      onDone()
    } catch (e) {
      setError(`업로드 실패: ${e.message}`)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="닫기" disabled={busy}>
          ×
        </button>
        <div className="builder-head">
          <h2>＋ 작품 추가</h2>
          <p>파일을 고른 뒤, 올릴 것만 남기고 ✕로 빼면 됩니다.</p>
        </div>

        <div className="builder-fields" style={{ marginTop: 18 }}>
          <div className="field">
            <label>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 메이드 컨셉" />
          </div>
          <div className="field">
            <label>카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">선택 안 함</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>사용한 도구 (여러 개 선택 가능)</label>
            <ToolPicker value={tools} onChange={setTools} />
          </div>
          <div className="field">
            <label>연결할 템플릿 (선택)</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">없음</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>프롬프트</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="이 작품을 만든 프롬프트"
            />
          </div>
          <div className="field">
            <label>이미지 / 영상 선택 *</label>
            <input type="file" accept="image/*,video/*" multiple onChange={addFiles} />
            {items.length > 0 && (
              <>
                <span className="hint">{items.length}개 선택됨 · 올리고 싶지 않은 건 ✕</span>
                <div className="edit-media">
                  {items.map((it) => (
                    <div key={it.id} className="edit-thumb">
                      {it.isVideo ? (
                        <video src={it.url} muted preload="metadata" />
                      ) : (
                        <img src={it.url} alt="" />
                      )}
                      <button type="button" onClick={() => removeItem(it.id)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="builder-btn full" onClick={submit} disabled={busy}>
          {busy ? '업로드 중…' : `작품 올리기${items.length ? ` (${items.length}개)` : ''}`}
        </button>
      </div>
    </div>
  )
}
