import { useState } from 'react'
import { templates } from '../data/templates.js'
import TemplateCard from './TemplateCard.jsx'
import PromptBuilderModal from './PromptBuilderModal.jsx'

export default function Generator({ onViewWorks }) {
  const [builder, setBuilder] = useState(null)

  return (
    <div className="generator">
      <div className="tpl-grid">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onOpenBuilder={setBuilder}
            onViewWorks={onViewWorks}
          />
        ))}
      </div>

      {builder && (
        <PromptBuilderModal template={builder} onClose={() => setBuilder(null)} />
      )}
    </div>
  )
}
