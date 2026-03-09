'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Project, TmSheet, LaborItem, MaterialItem, TmSheetWithItems } from '@/lib/database.types'
import TmSheetForm from '@/components/TmSheetForm'
import TmSheetView from '@/components/TmSheetView'

export default function TmSheetPage() {
  const { id, tmId } = useParams<{ id: string; tmId: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [sheet, setSheet] = useState<TmSheetWithItems | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [{ data: proj }, { data: sheetData }, { data: labor }, { data: material }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tm_sheets').select('*').eq('id', tmId).single(),
      supabase.from('labor_items').select('*').eq('tm_sheet_id', tmId).order('item_number'),
      supabase.from('material_items').select('*').eq('tm_sheet_id', tmId).order('item_number'),
    ])
    setProject(proj)
    if (sheetData) {
      const sheet: TmSheetWithItems = {
        ...(sheetData as TmSheet),
        labor_items: (labor ?? []) as LaborItem[],
        material_items: (material ?? []) as MaterialItem[],
        project: (proj ?? undefined) as Project | undefined,
      }
      setSheet(sheet)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [tmId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>
  }

  if (!project || !sheet) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Not found</div>
  }

  // Approved sheets are read-only
  if (sheet.status === 'approved') {
    return (
      <TmSheetView
        sheet={sheet}
        onBack={() => router.push(`/projects/${id}`)}
      />
    )
  }

  return (
    <TmSheetForm
      project={project}
      sheet={sheet}
      onSaved={() => load()}
      onCancel={() => router.push(`/projects/${id}`)}
    />
  )
}
