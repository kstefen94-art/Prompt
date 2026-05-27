import { useEffect, useMemo, useState } from 'react'
import GalleryCard from './GalleryCard.jsx'
import GalleryLightbox from './GalleryLightbox.jsx'
import UploadModal from './UploadModal.jsx'
import EditModal from './EditModal.jsx'
import { useWorks, deleteWork } from '../lib/galleryApi.js'

const ALL = '전체'

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem('gallery_favs')) || [])
  } catch {
    return new Set()
  }
}

export default function Gallery({ filterTemplateId, onClearTemplateFilter, user }) {
  const { works, loading, error, refresh } = useWorks()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [sort, setSort] = useState('latest')
  const [favsOnly, setFavsOnly] = useState(false)
  const [favs, setFavs] = useState(loadFavs)
  const [opened, setOpened] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    localStorage.setItem('gallery_favs', JSON.stringify([...favs]))
  }, [favs])

  const categories = useMemo(() => {
    const set = new Set()
    works.forEach((w) => w.categories.forEach((c) => set.add(c)))
    return [ALL, ...set]
  }, [works])

  function toggleFav(no) {
    setFavs((prev) => {
      const next = new Set(prev)
      next.has(no) ? next.delete(no) : next.add(no)
      return next
    })
  }

  async function handleDelete(work) {
    if (!confirm(`"${work.title}" 작품을 삭제할까요? 되돌릴 수 없습니다.`)) return
    try {
      await deleteWork(work)
      setOpened(null)
      refresh()
    } catch (e) {
      alert(`삭제 실패: ${e.message}`)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = works.filter((w) => {
      if (filterTemplateId && w.templateId !== filterTemplateId) return false
      if (favsOnly && !favs.has(w.no)) return false
      if (category !== ALL && !w.categories.includes(category)) return false
      if (!q) return true
      return (
        w.title.toLowerCase().includes(q) ||
        w.prompt.toLowerCase().includes(q) ||
        w.categories.join(' ').toLowerCase().includes(q)
      )
    })
    return [...list].sort((a, b) => {
      if (sort === 'promptLen') return b.prompt.length - a.prompt.length
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }, [works, query, category, sort, favsOnly, favs, filterTemplateId])

  return (
    <div className="gallery">
      <div className="gallery-top">
        <span className="g-all">
          전체 <strong>{filtered.length}</strong>
        </span>
        <div className="g-top-actions">
          <button
            className={`g-fav-toggle ${favsOnly ? 'on' : ''}`}
            onClick={() => setFavsOnly((v) => !v)}
          >
            {favsOnly ? '♥' : '♡'} 즐겨찾기
          </button>
          {user && (
            <button className="add-btn" onClick={() => setShowUpload(true)}>
              ＋ 작품 추가
            </button>
          )}
        </div>
      </div>

      {filterTemplateId && (
        <div className="template-filter-note">
          <span>
            패턴 <code>{filterTemplateId}</code> 의 작품만 보는 중
          </span>
          <button onClick={onClearTemplateFilter}>전체 보기 ✕</button>
        </div>
      )}

      <div className="g-toolbar">
        <div className="search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M8.5 3a5.5 5.5 0 0 1 4.23 9.02l3.12 3.13a1 1 0 0 1-1.41 1.41l-3.13-3.12A5.5 5.5 0 1 1 8.5 3Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
              fill="currentColor"
            />
          </svg>
          <input
            type="search"
            placeholder="프롬프트·제목 검색…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="g-sort">
          <option value="latest">최신순</option>
          <option value="promptLen">프롬프트 길이</option>
        </select>
      </div>

      <div className="chips g-cats">
        {categories.map((c) => (
          <button
            key={c}
            className={`chip ${category === c ? 'chip--active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error-text">불러오기 오류: {error}</p>}

      {loading ? (
        <div className="empty">
          <p>불러오는 중…</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="masonry">
          {filtered.map((w) => (
            <GalleryCard
              key={w.no}
              work={w}
              favorite={favs.has(w.no)}
              onToggleFav={toggleFav}
              onOpen={() => setOpened(w)}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>표시할 작품이 없어요.</p>
          {user ? (
            <button className="add-btn" onClick={() => setShowUpload(true)}>
              ＋ 첫 작품 올리기
            </button>
          ) : (
            <p className="hint">프로필 탭에서 로그인하면 작품을 추가할 수 있어요.</p>
          )}
        </div>
      )}

      {opened && (
        <GalleryLightbox
          work={opened}
          favorite={favs.has(opened.no)}
          onToggleFav={toggleFav}
          canEdit={Boolean(user)}
          onDelete={() => handleDelete(opened)}
          onEdit={() => {
            setEditing(opened)
            setOpened(null)
          }}
          onClose={() => setOpened(null)}
        />
      )}

      {showUpload && user && (
        <UploadModal
          userId={user.id}
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false)
            refresh()
          }}
        />
      )}

      {editing && user && (
        <EditModal
          work={editing}
          userId={user.id}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
