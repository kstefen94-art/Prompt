import { useState } from 'react'
import Gallery from './components/Gallery.jsx'
import Generator from './components/Generator.jsx'

const TABS = [
  { id: 'gallery', label: '갤러리', icon: '🖼' },
  { id: 'generator', label: '생성기', icon: '✨' },
  { id: 'profile', label: '프로필', icon: '👤' },
]

const HEADERS = {
  gallery: { title: '갤러리', sub: '직접 만든 AI 이미지와 영상 모음' },
  generator: { title: '프롬프트 생성기', sub: '자주 사용되는 프롬프트 구조와 패턴 모음' },
  profile: { title: '프로필', sub: '' },
}

export default function App() {
  const [tab, setTab] = useState('gallery')
  const [templateFilter, setTemplateFilter] = useState(null)

  function viewWorks(templateId) {
    setTemplateFilter(templateId)
    setTab('gallery')
  }

  const header = HEADERS[tab]

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <h1>{header.title}</h1>
            {header.sub && <p>{header.sub}</p>}
          </div>
          <span className="lang">🌐 한국어</span>
        </div>
      </header>

      <main className="content">
        {tab === 'gallery' && (
          <Gallery
            filterTemplateId={templateFilter}
            onClearTemplateFilter={() => setTemplateFilter(null)}
          />
        )}
        {tab === 'generator' && <Generator onViewWorks={viewWorks} />}
        {tab === 'profile' && (
          <div className="profile">
            <div className="profile-avatar">AI</div>
            <h2>나의 프롬프트 스튜디오</h2>
            <p className="profile-bio">
              직접 만든 AI 이미지와 그것을 만든 프롬프트를 모아두는 공간입니다.
            </p>
            <p className="hint">
              소개 문구는 <code>src/App.jsx</code> 의 profile 영역에서 수정할 수 있어요.
            </p>
          </div>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabbar-btn ${tab === t.id ? 'on' : ''}`}
            onClick={() => {
              if (t.id === 'gallery' && tab === 'gallery') setTemplateFilter(null)
              setTab(t.id)
            }}
          >
            <span className="tabbar-icon">{t.icon}</span>
            <span className="tabbar-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
