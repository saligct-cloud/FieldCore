'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/database.types'
import TmSheetForm from '@/components/TmSheetForm'

export default function NewTmSheet() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => setProject(data))
  }, [id])

  if (!project) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  }

  return (
    <TmSheetForm
      project={project}
      sheet={null}
      onSaved={(sheetId) => router.push(`/projects/${id}/tm/${sheetId}`)}
      onCancel={() => router.push(`/projects/${id}`)}
    />
  )
}
