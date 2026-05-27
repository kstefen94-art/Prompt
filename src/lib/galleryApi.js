import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseEnabled, publicUrl, BUCKET } from './supabase.js'
import { works as staticWorks } from '../data/gallery.js'

function normalize(row) {
  return {
    no: row.id,
    title: row.title,
    categories: row.categories || [],
    templateId: row.template_id || null,
    prompt: row.prompt || '',
    createdAt: row.created_at,
    media: (row.media || []).map((m) => ({ type: m.type, src: publicUrl(m.path) })),
    _paths: (row.media || []).map((m) => m.path),
  }
}

export function useWorks() {
  const [works, setWorks] = useState(supabaseEnabled ? [] : staticWorks)
  const [loading, setLoading] = useState(supabaseEnabled)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return
    setLoading(true)
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      setWorks((data || []).map(normalize))
      setError('')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { works, loading, error, refresh }
}

function mediaType(file) {
  if (file.type.startsWith('video')) return 'video'
  if (file.type.startsWith('image')) return 'image'
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  return ['mp4', 'webm', 'mov', 'm4v'].includes(ext) ? 'video' : 'image'
}

export async function addWork({ title, categories, templateId, prompt, files }, userId) {
  const media = []
  for (const file of files) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    media.push({ type: mediaType(file), path })
  }
  const { error } = await supabase
    .from('works')
    .insert({ title, categories, template_id: templateId || null, prompt, media })
  if (error) throw error
}

export async function deleteWork(work) {
  if (work._paths?.length) {
    await supabase.storage.from(BUCKET).remove(work._paths)
  }
  const { error } = await supabase.from('works').delete().eq('id', work.no)
  if (error) throw error
}

// keptMedia: 유지할 항목 [{type, path}], removedPaths: 삭제할 스토리지 경로[], newFiles: 새로 추가할 File[]
export async function updateWork(work, { title, categories, templateId, prompt, keptMedia, removedPaths, newFiles }, userId) {
  const added = []
  for (const file of newFiles || []) {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    added.push({ type: mediaType(file), path })
  }
  if (removedPaths?.length) {
    await supabase.storage.from(BUCKET).remove(removedPaths)
  }
  const media = [...(keptMedia || []), ...added]
  const { error } = await supabase
    .from('works')
    .update({ title, categories, template_id: templateId || null, prompt, media })
    .eq('id', work.no)
  if (error) throw error
}
