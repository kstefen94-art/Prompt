import { useEffect, useState } from 'react'
import { templates } from '../data/templates.js'
import { updateWork } from '../lib/galleryApi.js'
import ToolPicker from './ToolPicker.jsx'

export default function EditModal({ work, userId, onClose, onDone }) {
  const [title, setTitle] = useState(work.title)
  const [categories, setCategories] = useState((work.categories || []).join(', '))
  const [tools, setTools] = useState(work.tools || [])
  const [templateId, setTemplateId] = useState(work.templateId || '')
  const [prompt, setPrompt] = useState(work.prompt || '')
  // 기존 미디어: {type, src, path, remove}
  const [items, setItems] = useState(
    work.media.map((m, i) => ({ type: m.type, src: m.src, path: work._paths[i], remove: false })),
  )
  const [newFiles, setNewFiles] = useState([])
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

  function toggleRemove(i) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, remove: !it.remove } : it)))
  }

  async function save() {
    if (!title.trim()) return setError('제목을 입력하세요.')
    const kept = items.filter((it) => !it.remove)
    if (kept.length === 0 && newFiles.length === 0)
      return setError('최소 1개의 이미지/영상이 있어야 합니다.')
    setError('')
    setBusy(true)
    try {
      await updateWork(
        work,
        {
          title: title.trim(),
          categories: categories.split(',').map((c) => c.trim()).filter(Boolean),
          tools,
          templateId,
          prompt: prompt.trim(),
          keptMedia: kept.map((it) => ({ type: it.type, path: it.path })),
          removedPaths: items.filter((it) => it.remove).map((it) => it.path),
          newFiles,
        },
        userId,
      )
      onDone()
    } catch (e) {
      setError(`수정 실패: ${e.message}`)
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
          <h2>✎ 작품 수정</h2>
          <p>정보를 바꾸고, 이미지를 일부만 빼거나 새로 추가할 수 있어요.</p>
        </div>

        <div className="builder-fields" style={{ marginTop: 18 }}>
          <div className="field">
            <label>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>카테고리 (쉼표로 구분)</label>
            <input value={categories} onChange={(e) => setCategories(e.target.value)} />
          </div>
          <div className="field">
            <label>사용한 도구</label>
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
            <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          <div className="field">
            <label>현재 이미지/영상 (✕ 누르면 삭제 표시)</label>
            <div className="edit-media">
              {items.map((it, i) => (
                <div key={i} className={`edit-thumb ${it.remove ? 'removing' : ''}`}>
                  {it.type === 'video' ? (
                    <video src={it.src} muted preload="metadata" />
                  ) : (
                    <img src={it.src} alt="" />
                  )}
                  <button type="button" onClick={() => toggleRemove(i)}>
                    {it.remove ? '되돌리기' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="field">
            <label>새 이미지/영상 추가</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setNewFiles([...e.target.files])}
            />
            {newFiles.length > 0 && <span className="hint">{newFiles.length}개 추가 예정</span>}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="builder-btn full" onClick={save} disabled={busy}>
          {busy ? '저장 중…' : '변경 사항 저장'}
        </button>
      </div>
    </div>
  )
}
