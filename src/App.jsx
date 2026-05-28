import { lazy, Suspense, useState } from 'react'
import Gallery from './components/Gallery.jsx'
import Generator from './components/Generator.jsx'
import Drafts from './components/Drafts.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import TabIcon from './components/TabIcon.jsx'
import Splash from './components/Splash.jsx'
import { useAuth } from './lib/useAuth.js'

// 무거운 제작(Studio)은 지연 로딩 → 갤러리 방문자는 가벼운 번들만 받음
const Studio = lazy(() => import('./components/Studio.jsx'))

const HEADERS = {
  gallery: { title: '갤러리', sub: '직접 만든 AI 이미지와 영상 모음' },
  generator: { title: '프롬프트 생성기', sub: '자주 사용되는 프롬프트 구조와 패턴 모음' },
  studio: { title: '제작', sub: 'Z-Image · FLUX · Seedream 으로 생성·편집 (나만)' },
  profile: { title: '프로필', sub: '' },
}

export default function App() {
  const auth = useAuth()
  const [tab, setTab] = useState('gallery')
  const [templateFilter, setTemplateFilter] = useState(null)
  const [splash, setSplash] = useState(true)

  function viewWorks(templateId) {
    setTemplateFilter(templateId)
    setTab('gallery')
  }

  // 제작 탭은 로그인한 본인에게만 노출됩니다.
  const tabs = [
    { id: 'gallery', label: '갤러리' },
    { id: 'generator', label: '생성기' },
    ...(auth.user ? [{ id: 'studio', label: '제작' }] : []),
    { id: 'profile', label: '프로필' },
  ]

  // 로그아웃 등으로 접근 불가한 탭이면 갤러리로 되돌립니다.
  const activeTab = tab === 'studio' && !auth.user ? 'gallery' : tab
  const header = HEADERS[activeTab]

  return (
    <div className="app">
      {splash && <Splash onDone={() => setSplash(false)} />}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" width="32" height="32">
                <defs>
                  <linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#c4b5fd" />
                    <stop offset="0.5" stop-color="#8b5cf6" />
                    <stop offset="1" stop-color="#6d28d9" />
                  </linearGradient>
                  <radialGradient id="glA" cx="50%" cy="45%" r="55%">
                    <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
                    <stop offset="1" stop-color="#fff" stop-opacity="0" />
                  </radialGradient>
                </defs>
                <rect width="40" height="40" rx="11" fill="url(#lgA)" />
                <circle cx="20" cy="18" r="14" fill="url(#glA)" />
                <path d="M20 7 L23 17 L33 20 L23 23 L20 33 L17 23 L7 20 L17 17 Z" fill="#fff" />
                <path d="M31 8 l1.4 3.4 3.4 1.4 -3.4 1.4 -1.4 3.4 -1.4 -3.4 -3.4 -1.4 3.4 -1.4 z" fill="#fff" opacity="0.9" />
              </svg>
            </span>
            <span className="brand-name"><span className="brand-ai">AI</span>Showcase</span>
          </div>
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
        {/* 제작 탭은 항상 마운트해두고 화면에서만 숨김 → 탭 이동해도 상태·실행 유지 */}
        {auth.user && (
          <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}>
            <Suspense fallback={<div className="empty"><p>불러오는 중…</p></div>}>
              <Studio user={auth.user} onGoProfile={() => setTab('profile')} />
            </Suspense>
          </div>
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
            <span className="tabbar-icon">
              <TabIcon name={t.id} />
            </span>
            <span className="tabbar-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
