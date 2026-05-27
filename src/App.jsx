import { useMemo, useState } from 'react'
import { prompts } from './data/prompts.js'
import PromptCard from './components/PromptCard.jsx'
import PromptModal from './components/PromptModal.jsx'
import PromptGenerator from './components/PromptGenerator.jsx'

const ALL = '전체'

export default function App() {
  const [view, setView] = useState('gallery')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL)
  const [selected, setSelected] = useState(null)

  const categories = useMemo(() => {
    const set = new Set(prompts.map((p) => p.category))
    return [ALL, ...set]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return prompts.filter((p) => {
      const matchesCategory =
        activeCategory === ALL || p.category === activeCategory
      if (!matchesCategory) return false
      if (!q) return true
      const haystack = [
        p.title,
        p.description,
        p.category,
        p.prompt,
        ...(p.tags || []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, activeCategory])

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-inner">
          <span className="badge">Prompt Studio</span>
          <h1>나의 AI &amp; 프롬프트 갤러리</h1>
          <p className="subtitle">
            직접 만든 프롬프트를 모아 두는 공간입니다. 마음에 드는 프롬프트를
            찾아 바로 복사하거나, 생성기로 새 프롬프트를 만들어 보세요.
          </p>
          <nav className="tabs">
            <button
              className={`tab ${view === 'gallery' ? 'tab--active' : ''}`}
              onClick={() => setView('gallery')}
            >
              갤러리
            </button>
            <button
              className={`tab ${view === 'generator' ? 'tab--active' : ''}`}
              onClick={() => setView('generator')}
            >
              프롬프트 생성기
            </button>
          </nav>
        </div>
      </header>

      <main className="container">
        {view === 'generator' && <PromptGenerator />}
        {view === 'gallery' && (
          <>
        <div className="toolbar">
          <div className="search">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M8.5 3a5.5 5.5 0 0 1 4.23 9.02l3.12 3.13a1 1 0 0 1-1.41 1.41l-3.13-3.12A5.5 5.5 0 1 1 8.5 3Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
                fill="currentColor"
              />
            </svg>
            <input
              type="search"
              placeholder="제목, 설명, 태그로 검색…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="프롬프트 검색"
            />
          </div>
          <span className="count">{filtered.length}개</span>
        </div>

        <div className="chips" role="tablist" aria-label="카테고리">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'chip--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              role="tab"
              aria-selected={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <section className="grid">
            {filtered.map((p) => (
              <PromptCard key={p.id} prompt={p} onOpen={() => setSelected(p)} />
            ))}
          </section>
        ) : (
          <div className="empty">
            <p>조건에 맞는 프롬프트가 없어요.</p>
            <button
              className="link-btn"
              onClick={() => {
                setQuery('')
                setActiveCategory(ALL)
              }}
            >
              필터 초기화
            </button>
          </div>
        )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          made with React + Vite · 프롬프트는{' '}
          <code>src/data/prompts.js</code> 에서 편집할 수 있어요.
        </p>
      </footer>

      {selected && (
        <PromptModal prompt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
