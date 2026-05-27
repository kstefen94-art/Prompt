function Cover({ item }) {
  if (item.type === 'video') {
    return (
      <video
        className="cover"
        src={item.src}
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  return <img className="cover" src={item.src} alt="" loading="lazy" />
}

export default function GalleryCard({ work, favorite, onToggleFav, onOpen }) {
  const count = work.media.length
  const hasVideo = work.media.some((m) => m.type === 'video')

  return (
    <article className="photo" onClick={onOpen}>
      <div className="photo-media">
        <Cover item={work.media[0]} />
        <div className="photo-badges">
          <button
            className={`icon-btn ${favorite ? 'icon-btn--fav' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleFav(work.no)
            }}
            aria-label="즐겨찾기"
          >
            {favorite ? '♥' : '♡'}
          </button>
        </div>
        {count > 1 && (
          <span className="count-badge">
            {hasVideo ? '▶' : '🖼'} {count}
          </span>
        )}
      </div>
      <div className="photo-info">
        <div className="photo-meta">
          <span>NO. {work.no}</span>
          <span>{count} {hasVideo ? 'CLIP' : 'IMG'}</span>
        </div>
        <h3 className="photo-title">{work.title}</h3>
        <p className="photo-prompt">{work.prompt}</p>
        <div className="photo-tags">
          {work.categories.map((c) => (
            <span key={c} className="cat-tag">{c}</span>
          ))}
          {(work.tools || []).map((t) => (
            <span key={t} className="tool-tag">🛠 {t}</span>
          ))}
        </div>
      </div>
    </article>
  )
}
