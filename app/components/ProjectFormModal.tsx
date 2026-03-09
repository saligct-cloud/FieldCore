'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/lib/database.types'

interface Props {
  project: Project | null
  onClose: () => void
  onSaved: () => void
}

export default function ProjectFormModal({ project, onClose, onSaved }: Props) {
  const [name, setName] = useState(project?.name ?? '')
  const [location, setLocation] = useState(project?.location ?? '')
  const [pm, setPm] = useState(project?.gc_project_manager ?? '')
  const [contract, setContract] = useState(project?.contract_number ?? '')
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>(project?.email_list ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e.includes('@')) { setError('Enter a valid email'); return }
    if (emailList.includes(e)) { setEmailInput(''); return }
    setEmailList([...emailList, e])
    setEmailInput('')
    setError('')
  }

  async function save() {
    if (!name || !location || !pm) { setError('Name, location, and PM are required'); return }
    if (emailList.length === 0) { setError('Add at least one email address'); return }
    setSaving(true)
    setError('')

    const payload = {
      name,
      location,
      gc_project_manager: pm,
      contract_number: contract || null,
      email_list: emailList,
    }

    let err
    if (project) {
      ;({ error: err } = await supabase.from('projects').update(payload).eq('id', project.id))
    } else {
      ;({ error: err } = await supabase.from('projects').insert(payload))
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="text-lg font-semibold">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Burnaby Office Tower"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Location *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 1234 Main St, Burnaby BC"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GC Project Manager *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
              value={pm}
              onChange={(e) => setPm(e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract #</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="e.g. C-2024-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Distribution List *</label>
            <div className="flex gap-2 mb-2">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a2e]"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                placeholder="email@example.com"
                type="email"
              />
              <button
                onClick={addEmail}
                className="px-4 py-2 bg-[#1a1a2e] text-white text-sm rounded-lg font-medium"
              >
                Add
              </button>
            </div>
            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {emailList.map((email) => (
                  <span key={email} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-2 py-1">
                    {email}
                    <button onClick={() => setEmailList(emailList.filter((e) => e !== email))} className="text-gray-400 hover:text-red-500 ml-1">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="px-4 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
