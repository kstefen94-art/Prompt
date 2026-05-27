import { useEffect, useMemo, useState } from 'react'
import { works } from '../data/gallery.js'
import GalleryCard from './GalleryCard.jsx'
import GalleryLightbox from './GalleryLightbox.jsx'

const ALL = '전체'

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem('gallery_favs')) || [])
  } catch {
    return new Set()
  }
}

export default function Gallery({ filterTemplateId, onClearTemplateFilter }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL)
  const [sort, setSort] = useState('latest') // latest | promptLen
  const [favsOnly, setFavsOnly] = useState(false)
  const [favs, setFavs] = useState(loadFavs)
  const [opened, setOpened] = useState(null)

  useEffect(() => {
    localStorage.setItem('gallery_favs', JSON.stringify([...favs]))
  }, [favs])

  const categories = useMemo(() => {
    const set = new Set()
    works.forEach((w) => w.categories.forEach((c) => set.add(c)))
    return [ALL, ...set]
  }, [])

  function toggleFav(no) {
    setFavs((prev) => {
      const next = new Set(prev)
      next.has(no) ? next.delete(no) : next.add(no)
      return next
    })
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
    list = [...list].sort((a, b) => {
      if (sort === 'promptLen') return b.prompt.length - a.prompt.length
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
    return list
  }, [query, category, sort, favsOnly, favs, filterTemplateId])

  const activeTemplateTitle = filterTemplateId

  return (
    <div className="gallery">
      <div className="gallery-top">
        <span className="g-all">
          전체 <strong>{filtered.length}</strong>
        </span>
        <button
          className={`g-fav-toggle ${favsOnly ? 'on' : ''}`}
          onClick={() => setFavsOnly((v) => !v)}
        >
          {favsOnly ? '♥' : '♡'} 즐겨찾기
        </button>
      </div>

      {filterTemplateId && (
        <div className="template-filter-note">
          <span>패턴 <code>{activeTemplateTitle}</code> 의 작품만 보는 중</span>
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

      {filtered.length > 0 ? (
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
          <p className="hint">
            <code>public/gallery/</code> 에 이미지·영상을 넣고{' '}
            <code>src/data/gallery.js</code> 에 추가하세요.
          </p>
        </div>
      )}

      {opened && (
        <GalleryLightbox
          work={opened}
          favorite={favs.has(opened.no)}
          onToggleFav={toggleFav}
          onClose={() => setOpened(null)}
        />
      )}
    </div>
  )
}
