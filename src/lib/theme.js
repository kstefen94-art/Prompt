const KEY = 'site_theme'

// swatch: [배경색, 포인트색] — 미리보기 점에 사용
export const THEMES = [
  { id: 'icemint', name: 'Ice × Mint', desc: '아이스라떼 + 민트 (현재)', swatch: ['#e4ddd3', '#00a19b'] },
  { id: 'minimal', name: '모던 미니멀', desc: '화이트 + 인디고', swatch: ['#ffffff', '#4f46e5'] },
  { id: 'dark', name: '다크 네온', desc: '블랙 + 시안', swatch: ['#0e0f13', '#22d3ee'] },
  { id: 'gradient', name: '컬러풀', desc: '라이트 + 퍼플/핑크', swatch: ['#faf7ff', '#a21caf'] },
  { id: 'editorial', name: '에디토리얼', desc: '아이보리 + 세리프', swatch: ['#f6f4ef', '#111111'] },
]

export function loadTheme() {
  return localStorage.getItem(KEY) || 'icemint'
}

export function applyTheme(id) {
  if (id === 'icemint') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem(KEY, id)
}
