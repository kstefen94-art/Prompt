import { useEffect, useState } from 'react'
import Gallery from './components/Gallery.jsx'
import Generator from './components/Generator.jsx'
import Studio from './components/Studio.jsx'
import Drafts from './components/Drafts.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import ThemePicker from './components/ThemePicker.jsx'
import { useAuth } from './lib/useAuth.js'
import { applyTheme, loadTheme } from './lib/theme.js'

const HEADERS = {
  gallery: { title: '갤러리', sub: '직접 만든 AI 이미지와 영상 모음' },
  generator: { title: '프롬프트 생성기', sub: '자주 사용되는 프롬프트 구조와 패턴 모음' },
  studio: { title: '제작', sub: 'Z-Image · InstantID 로 이미지 생성 (나만)' },
  profile: { title: '프로필', sub: '' },
}

export default function App() {
  const auth = useAuth()
  const [tab, setTab] = useState('gallery')
  const [templateFilter, setTemplateFilter] = useState(null)

  useEffect(() => {
    applyTheme(loadTheme())
  }, [])

  function viewWorks(templateId) {
    setTemplateFilter(templateId)
    setTab('gallery')
  }

  // 제작 탭은 로그인한 본인에게만 노출됩니다.
  const tabs = [
    { id: 'gallery', label: '갤러리', icon: '🖼' },
    { id: 'generator', label: '생성기', icon: '✨' },
    ...(auth.user ? [{ id: 'studio', label: '제작', icon: '🎨' }] : []),
    { id: 'profile', label: '프로필', icon: '👤' },
  ]

  // 로그아웃 등으로 접근 불가한 탭이면 갤러리로 되돌립니다.
  const activeTab = tab === 'studio' && !auth.user ? 'gallery' : tab
  const header = HEADERS[activeTab]

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="30" height="30">
                <rect width="32" height="32" rx="9" fill="#00a19b" />
                <path
                  d="M16 6.2 L18.4 13.6 L25.8 16 L18.4 18.4 L16 25.8 L13.6 18.4 L6.2 16 L13.6 13.6 Z"
                  fill="#fff"
                />
              </svg>
            </span>
            <span className="brand-name">Prompt&nbsp;Studio</span>
          </div>
          <span className="lang">🌐 한국어</span>
        </div>
      </header>

      <main className="content">
        <div className="page-hero">
          <h1>{header.title}</h1>
          {header.sub && <p>{header.sub}</p>}
        </div>

        {activeTab === 'gallery' && (
          <Gallery
            filterTemplateId={templateFilter}
            onClearTemplateFilter={() => setTemplateFilter(null)}
            user={auth.user}
          />
        )}
        {activeTab === 'generator' && <Generator onViewWorks={viewWorks} />}
        {activeTab === 'studio' && auth.user && (
          <Studio user={auth.user} onGoProfile={() => setTab('profile')} />
        )}
        {activeTab === 'profile' && (
          <div className="profile">
            <div className="profile-avatar">AI</div>
            <h2>나의 프롬프트 스튜디오</h2>
            <p className="profile-bio">
              직접 만든 AI 이미지와 그것을 만든 프롬프트를 모아두는 공간입니다.
            </p>
            <AuthPanel auth={auth} />
            {auth.user && <Drafts />}
            <ThemePicker />
          </div>
        )}
      </main>

      <nav className="tabbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tabbar-btn ${activeTab === t.id ? 'on' : ''}`}
            onClick={() => {
              if (t.id === 'gallery' && activeTab === 'gallery') setTemplateFilter(null)
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
