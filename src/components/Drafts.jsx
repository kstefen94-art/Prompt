import { useEffect, useState } from 'react'
import { listDrafts, deleteDraft, publishDraft } from '../lib/drafts.js'

export default function Drafts() {
  const [drafts, setDrafts] = useState([])
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    try {
      setDrafts(await listDrafts())
    } catch (e) {
      setMsg(`불러오기 오류: ${e.message}`)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function publish(d) {
    setBusyId(d.id)
    setMsg('')
    try {
      await publishDraft(d)
      setMsg('갤러리로 보냈습니다 ✓')
      await load()
    } catch (e) {
      setMsg(`갤러리 전송 실패: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function remove(d) {
    if (!confirm('이 임시저장을 삭제할까요?')) return
    try {
      await deleteDraft(d)
      load()
    } catch (e) {
      setMsg(`삭제 실패: ${e.message}`)
    }
  }

  if (drafts.length === 0) {
    return (
      <div className="drafts">
        <h3 className="drafts-title">임시저장</h3>
        {msg && <p className="hint">{msg}</p>}
        <p className="hint">
          제작 탭에서 생성한 이미지를 임시저장하면 여기에 모입니다. 확인 후 갤러리로 보낼 수 있어요.
        </p>
      </div>
    )
  }

  return (
    <div className="drafts">
      <h3 className="drafts-title">임시저장 ({drafts.length})</h3>
      {msg && <p className="hint">{msg}</p>}
      <div className="draft-list">
        {drafts.map((d) => (
          <div key={d.id} className="draft-card">
            <div className="draft-thumbs">
              {d.media.map((m, i) =>
                m.type === 'video' ? (
                  <video key={i} src={m.src} muted preload="metadata" />
                ) : (
                  <img key={i} src={m.src} alt="" />
                ),
              )}
            </div>
            <div className="draft-body">
              <strong>{d.title || '(제목 없음)'}</strong>
              {d.tools?.length > 0 && (
                <div className="photo-tags">
                  {d.tools.map((t) => (
                    <span key={t} className="tool-tag">🛠 {t}</span>
                  ))}
                </div>
              )}
              <pre className="draft-prompt">{d.prompt}</pre>
              <div className="draft-actions">
                <button
                  className="builder-btn"
                  disabled={busyId === d.id}
                  onClick={() => publish(d)}
                >
                  {busyId === d.id ? '보내는 중…' : '갤러리로 보내기'}
                </button>
                <button className="delete-btn" onClick={() => remove(d)}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
