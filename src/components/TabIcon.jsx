const base = {
  width: 23,
  height: 23,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export default function TabIcon({ name }) {
  if (name === 'gallery') {
    return (
      <svg {...base}>
        <rect x="3" y="4.5" width="18" height="15" rx="3" />
        <circle cx="8.5" cy="9.5" r="1.6" />
        <path d="M20.5 15.5 16 11l-6.5 6.5" />
      </svg>
    )
  }
  if (name === 'generator') {
    return (
      <svg {...base}>
        <path
          d="M12 3l1.7 4.6L18.3 9.3 13.7 11 12 15.6 10.3 11 5.7 9.3 10.3 7.6z"
          fill="currentColor"
          stroke="none"
        />
        <path
          d="M18.3 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    )
  }
  if (name === 'studio') {
    return (
      <svg {...base}>
        <path d="M5 19 15.5 8.5" />
        <path
          d="M18 3.5l.9 2.1 2.1.9-2.1.9L18 9.5l-.9-2.1L15 6.5l2.1-.9z"
          fill="currentColor"
          stroke="none"
        />
      </svg>
    )
  }
  // profile
  return (
    <svg {...base}>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}
