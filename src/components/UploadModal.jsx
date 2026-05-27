import { useEffect, useState } from 'react'
import { templates } from '../data/templates.js'
import { addWork } from '../lib/galleryApi.js'

export default function UploadModal({ userId, onClose, onDone }) {
  const [title, setTitle] = useState('')
  const [categories, setCategories] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [files, setFiles] = useState([])
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

  async function submit() {
    if (!title.trim()) return setError('제목을 입력하세요.')
    if (!files.length) return setError('이미지 또는 영상을 1개 이상 선택하세요.')
    setError('')
    setBusy(true)
    try {
      await addWork(
        {
          title: title.trim(),
          categories: categories
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          templateId,
          prompt: prompt.trim(),
          files,
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
          <p>이미지·영상을 올리고 정보를 입력하세요.</p>
        </div>

        <div className="builder-fields" style={{ marginTop: 18 }}>
          <div className="field">
            <label>제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 메이드 컨셉" />
          </div>
          <div className="field">
            <label>카테고리 (쉼표로 구분)</label>
            <input
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="예: 인물/화보, 캐릭터/코스프레"
            />
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
            <label>이미지 / 영상 (여러 개 가능) *</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
            />
            {files.length > 0 && <span className="hint">{files.length}개 선택됨</span>}
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="builder-btn full" onClick={submit} disabled={busy}>
          {busy ? '업로드 중…' : '작품 올리기'}
        </button>
      </div>
    </div>
  )
}
