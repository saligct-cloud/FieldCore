'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Project, TmSheet } from '@/lib/database.types'
import ProjectFormModal from '@/components/ProjectFormModal'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [sheets, setSheets] = useState<TmSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  async function load() {
    const [{ data: proj }, { data: sheetData }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tm_sheets').select('*').eq('project_id', id).order('sheet_number', { ascending: false }),
    ])
    setProject(proj)
    setSheets(sheetData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const approvedTotal = sheets
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + (s.grand_total ?? 0), 0)

  function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  function statusBadge(status: string) {
    if (status === 'approved') return <span className="badge-approved">Approved</span>
    if (status === 'pending') return <span className="badge-pending">Pending</span>
    return <span className="badge-draft">Draft</span>
  }

  function sheetNum(n: number) {
    return `T&M-${String(n).padStart(3, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Project not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-4 pt-4 pb-5 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-lg">←</button>
          <div className="text-xs text-gray-400 uppercase tracking-widest">FieldCore</div>
        </div>
        <h1 className="text-xl font-bold leading-tight">{project.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{project.location}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-gray-400">PM: {project.gc_project_manager} {project.contract_number ? `· Contract: ${project.contract_number}` : ''}</div>
          <button onClick={() => setShowEdit(true)} className="text-xs text-[#e8b04b] hover:underline">Edit</button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Stats bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex justify-between">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#1a1a2e]">{sheets.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Sheets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#1a1a2e]">{sheets.filter((s) => s.status === 'approved').length}</div>
            <div className="text-xs text-gray-500 mt-0.5">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-700">{fmt(approvedTotal)}</div>
            <div className="text-xs text-gray-500 mt-0.5">Approved Value</div>
          </div>
        </div>

        {/* T&M Sheets list */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">T&M Sheets</h2>
        </div>

        {sheets.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-base font-medium">No T&M sheets yet</p>
            <p className="text-sm mt-1">Tap + to create the first one</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sheets.map((sheet) => (
              <Link key={sheet.id} href={`/projects/${id}/tm/${sheet.id}`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm text-[#1a1a2e]">{sheetNum(sheet.sheet_number)}</span>
                        {statusBadge(sheet.status)}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{sheet.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(sheet.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold text-sm text-gray-900">{fmt(sheet.grand_total)}</div>
                      <div className="text-xs text-gray-400 mt-0.5">incl. GST</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Approved total footer */}
        {sheets.length > 0 && (
          <div className="mt-4 bg-[#1a1a2e] text-white rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm font-medium">Total Approved Value</span>
            <span className="text-lg font-bold">{fmt(approvedTotal)}</span>
          </div>
        )}
      </main>

      {/* FAB */}
      <Link href={`/projects/${id}/tm/new`} className="fab">+</Link>

      {showEdit && (
        <ProjectFormModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); load() }}
        />
      )}
    </div>
  )
}
