'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Project, TmSheet } from '@/lib/database.types'
import ProjectFormModal from '@/components/ProjectFormModal'

interface ProjectWithStats extends Project {
  tm_count: number
  approved_total: number
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  async function loadProjects() {
    setLoading(true)
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (!projectsData) {
      setLoading(false)
      return
    }

    // Load stats for each project
    const withStats = await Promise.all(
      (projectsData as Project[]).map(async (p: Project) => {
        const { data: sheets } = await supabase
          .from('tm_sheets')
          .select('id, status, grand_total')
          .eq('project_id', p.id)

        const sheetList = (sheets ?? []) as Pick<TmSheet, 'id' | 'status' | 'grand_total'>[]
        const tm_count = sheetList.length
        const approved_total = sheetList
          .filter((s) => s.status === 'approved')
          .reduce((sum, s) => sum + (s.grand_total ?? 0), 0)

        return { ...p, tm_count, approved_total }
      })
    )

    setProjects(withStats)
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-widest">DG Drywall & Construction</div>
          <div className="text-xl font-bold tracking-tight">FieldCore</div>
        </div>
        <div className="text-sm text-gray-400">T&M Manager</div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
          <span className="text-sm text-gray-500">{projects.length} active</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-1">Tap + to create your first project</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Link href={`/projects/${project.id}`} className="block p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{project.location}</p>
                      <p className="text-xs text-gray-400 mt-1">PM: {project.gc_project_manager}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-xs text-gray-400">{project.tm_count} sheet{project.tm_count !== 1 ? 's' : ''}</div>
                      <div className="text-sm font-semibold text-green-700 mt-0.5">{fmt(project.approved_total)}</div>
                      <div className="text-xs text-gray-400">approved</div>
                    </div>
                  </div>
                </Link>
                <div className="border-t border-gray-50 px-4 py-2 flex justify-end">
                  <button
                    onClick={() => { setEditProject(project); setShowModal(true) }}
                    className="text-xs text-[#1a1a2e] font-medium hover:underline"
                  >
                    Edit Project
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => { setEditProject(null); setShowModal(true) }}>
        +
      </button>

      {/* New/Edit Project Modal */}
      {showModal && (
        <ProjectFormModal
          project={editProject}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); loadProjects() }}
        />
      )}
    </div>
  )
}
