'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { supabase } from '@/lib/supabase'
import type { Project, TmSheetWithItems } from '@/lib/database.types'

interface LaborRow {
  id?: string
  item_number: number
  description: string
  num_workers: number
  hours_per_worker: number
  rate: number
}

interface MaterialRow {
  id?: string
  item_number: number
  description: string
  quantity: number
  unit: string
  cost_per_item: number
}

interface Props {
  project: Project
  sheet: TmSheetWithItems | null
  onSaved: (sheetId: string) => void
  onCancel: () => void
}

export default function TmSheetForm({ project, sheet, onSaved, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(sheet?.date ?? today)
  const [subject, setSubject] = useState(sheet?.subject ?? 'Time and Material sheet for extra work performed')
  const [labor, setLabor] = useState<LaborRow[]>(
    sheet?.labor_items.map((l) => ({
      id: l.id,
      item_number: l.item_number,
      description: l.description,
      num_workers: l.num_workers,
      hours_per_worker: l.hours_per_worker,
      rate: l.rate,
    })) ?? []
  )
  const [materials, setMaterials] = useState<MaterialRow[]>(
    sheet?.material_items.map((m) => ({
      id: m.id,
      item_number: m.item_number,
      description: m.description,
      quantity: m.quantity,
      unit: m.unit,
      cost_per_item: m.cost_per_item,
    })) ?? []
  )

  // Signature state
  const [foremanName, setForemanName] = useState(sheet?.foreman_name ?? '')
  const [superintendentName, setSuperintendentName] = useState(sheet?.superintendent_name ?? '')
  const [showForemanSig, setShowForemanSig] = useState(false)
  const [showSuperSig, setShowSuperSig] = useState(false)
  const foremanSigRef = useRef<SignatureCanvas>(null)
  const superSigRef = useRef<SignatureCanvas>(null)
  const [foremanSigData, setForemanSigData] = useState(sheet?.foreman_signature ?? '')
  const [superSigData, setSuperSigData] = useState(sheet?.superintendent_signature ?? '')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Calculations
  function laborSubtotal() {
    return labor.reduce((sum, l) => sum + l.num_workers * l.hours_per_worker * l.rate, 0)
  }
  function materialSubtotal() {
    return materials.reduce((sum, m) => sum + m.quantity * m.cost_per_item, 0)
  }
  function subtotal() { return laborSubtotal() + materialSubtotal() }
  function gst() { return subtotal() * 0.05 }
  function grandTotal() { return subtotal() + gst() }

  function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Labor row helpers
  function addLabor() {
    setLabor([...labor, { item_number: labor.length + 1, description: '', num_workers: 1, hours_per_worker: 8, rate: 0 }])
  }
  function updateLabor(i: number, field: keyof LaborRow, value: string | number) {
    const updated = [...labor]
    updated[i] = { ...updated[i], [field]: value }
    setLabor(updated)
  }
  function removeLabor(i: number) {
    setLabor(labor.filter((_, idx) => idx !== i).map((l, idx) => ({ ...l, item_number: idx + 1 })))
  }

  // Material row helpers
  function addMaterial() {
    setMaterials([...materials, { item_number: materials.length + 1, description: '', quantity: 1, unit: 'EA', cost_per_item: 0 }])
  }
  function updateMaterial(i: number, field: keyof MaterialRow, value: string | number) {
    const updated = [...materials]
    updated[i] = { ...updated[i], [field]: value }
    setMaterials(updated)
  }
  function removeMaterial(i: number) {
    setMaterials(materials.filter((_, idx) => idx !== i).map((m, idx) => ({ ...m, item_number: idx + 1 })))
  }

  async function save(newStatus?: string) {
    setSaving(true)
    setError('')
    try {
      const totals = {
        labor_subtotal: laborSubtotal(),
        material_subtotal: materialSubtotal(),
        gst: gst(),
        grand_total: grandTotal(),
      }

      let sheetId = sheet?.id
      const status = newStatus ?? sheet?.status ?? 'draft'

      if (!sheetId) {
        // Get next sheet number
        const { data: numData } = await supabase.rpc('next_sheet_number', { p_project_id: project.id })
        const sheetNumber = numData ?? 1

        const { data: newSheet, error: insertErr } = await supabase
          .from('tm_sheets')
          .insert({
            project_id: project.id,
            sheet_number: sheetNumber,
            date,
            subject,
            status,
            ...totals,
            foreman_name: foremanName || null,
            foreman_signature: foremanSigData || null,
            foreman_signed_at: foremanSigData ? new Date().toISOString() : null,
            superintendent_name: superintendentName || null,
            superintendent_signature: superSigData || null,
            superintendent_signed_at: superSigData ? new Date().toISOString() : null,
          })
          .select()
          .single()

        if (insertErr) throw insertErr
        sheetId = newSheet.id
      } else {
        const { error: updateErr } = await supabase
          .from('tm_sheets')
          .update({
            date,
            subject,
            status,
            ...totals,
            foreman_name: foremanName || null,
            foreman_signature: foremanSigData || sheet?.foreman_signature || null,
            foreman_signed_at: foremanSigData && !sheet?.foreman_signed_at ? new Date().toISOString() : sheet?.foreman_signed_at ?? null,
            superintendent_name: superintendentName || null,
            superintendent_signature: superSigData || sheet?.superintendent_signature || null,
            superintendent_signed_at: superSigData && !sheet?.superintendent_signed_at ? new Date().toISOString() : sheet?.superintendent_signed_at ?? null,
          })
          .eq('id', sheetId)

        if (updateErr) throw updateErr

        // Delete existing items to re-insert
        await Promise.all([
          supabase.from('labor_items').delete().eq('tm_sheet_id', sheetId),
          supabase.from('material_items').delete().eq('tm_sheet_id', sheetId),
        ])
      }

      // Insert labor items
      if (labor.length > 0) {
        const { error: laborErr } = await supabase.from('labor_items').insert(
          labor.map((l) => ({
            tm_sheet_id: sheetId!,
            item_number: l.item_number,
            description: l.description,
            num_workers: l.num_workers,
            hours_per_worker: l.hours_per_worker,
            rate: l.rate,
          }))
        )
        if (laborErr) throw laborErr
      }

      // Insert material items
      if (materials.length > 0) {
        const { error: matErr } = await supabase.from('material_items').insert(
          materials.map((m) => ({
            tm_sheet_id: sheetId!,
            item_number: m.item_number,
            description: m.description,
            quantity: m.quantity,
            unit: m.unit,
            cost_per_item: m.cost_per_item,
          }))
        )
        if (matErr) throw matErr
      }

      // If approving, send email
      if (status === 'approved') {
        await fetch('/api/tm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetId, pending: false }),
        })
      } else if (status === 'pending') {
        await fetch('/api/tm/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sheetId, pending: true }),
        })
      }

      onSaved(sheetId!)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function captureForemanSig() {
    if (foremanSigRef.current && !foremanSigRef.current.isEmpty()) {
      setForemanSigData(foremanSigRef.current.toDataURL())
      setShowForemanSig(false)
    }
  }
  function captureSuperSig() {
    if (superSigRef.current && !superSigRef.current.isEmpty()) {
      setSuperSigData(superSigRef.current.toDataURL())
      setShowSuperSig(false)
    }
  }

  const canApprove = (foremanSigData || sheet?.foreman_signature) && (superSigData || sheet?.superintendent_signature)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-4 py-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onCancel} className="text-gray-400 hover:text-white">←</button>
          <span className="text-xs text-gray-400 uppercase tracking-widest">FieldCore</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{sheet ? `T&M-${String(sheet.sheet_number).padStart(3, '0')}` : 'New T&M Sheet'}</h1>
          <span className="text-sm text-gray-300">{project.name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-36 space-y-6">
        {/* Project info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500">Project</div>
              <div className="text-sm font-medium truncate">{project.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Location</div>
              <div className="text-sm font-medium truncate">{project.location}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">GC PM</div>
              <div className="text-sm font-medium">{project.gc_project_manager}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-sm font-medium w-full focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm w-full border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
            />
          </div>
        </div>

        {/* Labor Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a2e] text-white px-4 py-2.5 flex items-center justify-between">
            <span className="font-semibold text-sm">A — Labor</span>
            <button onClick={addLabor} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg">+ Add Row</button>
          </div>
          {labor.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No labor items. Tap Add Row.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {labor.map((row, i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center">{row.item_number}</span>
                    <input
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                      placeholder="Labor description"
                      value={row.description}
                      onChange={(e) => updateLabor(i, 'description', e.target.value)}
                    />
                    <button onClick={() => removeLabor(i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">&times;</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-7">
                    <div>
                      <label className="text-xs text-gray-500">Workers</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.num_workers}
                        onChange={(e) => updateLabor(i, 'num_workers', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Hrs/Worker</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.hours_per_worker}
                        onChange={(e) => updateLabor(i, 'hours_per_worker', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Rate ($/hr)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.rate}
                        onChange={(e) => updateLabor(i, 'rate', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="ml-7 flex justify-between text-xs text-gray-500">
                    <span>Total hrs: {(row.num_workers * row.hours_per_worker).toFixed(1)}</span>
                    <span className="font-semibold text-gray-800">{fmt(row.num_workers * row.hours_per_worker * row.rate)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {labor.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Labor Subtotal</span>
              <span className="font-bold text-[#1a1a2e]">{fmt(laborSubtotal())}</span>
            </div>
          )}
        </div>

        {/* Material Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a2e] text-white px-4 py-2.5 flex items-center justify-between">
            <span className="font-semibold text-sm">B — Material</span>
            <button onClick={addMaterial} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg">+ Add Row</button>
          </div>
          {materials.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No material items. Tap Add Row.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {materials.map((row, i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-center">{row.item_number}</span>
                    <input
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                      placeholder="Material description"
                      value={row.description}
                      onChange={(e) => updateMaterial(i, 'description', e.target.value)}
                    />
                    <button onClick={() => removeMaterial(i)} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">&times;</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 ml-7">
                    <div>
                      <label className="text-xs text-gray-500">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.quantity}
                        onChange={(e) => updateMaterial(i, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Unit</label>
                      <input
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.unit}
                        onChange={(e) => updateMaterial(i, 'unit', e.target.value)}
                        placeholder="EA"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Cost/Item</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                        value={row.cost_per_item}
                        onChange={(e) => updateMaterial(i, 'cost_per_item', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="ml-7 text-right text-xs font-semibold text-gray-800">
                    {fmt(row.quantity * row.cost_per_item)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {materials.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Material Subtotal</span>
              <span className="font-bold text-[#1a1a2e]">{fmt(materialSubtotal())}</span>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a2e] text-white px-4 py-2.5">
            <span className="font-semibold text-sm">C — Totals</span>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Labor Subtotal</span>
              <span>{fmt(laborSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Material Subtotal</span>
              <span>{fmt(materialSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-gray-600">Subtotal</span>
              <span>{fmt(subtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">GST (5%)</span>
              <span>{fmt(gst())}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 text-[#1a1a2e]">
              <span>Grand Total</span>
              <span>{fmt(grandTotal())}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a2e] text-white px-4 py-2.5">
            <span className="font-semibold text-sm">D — Signatures</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Foreman */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Site Foreman (DG)</p>
              <input
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                placeholder="Foreman name"
                value={foremanName}
                onChange={(e) => setForemanName(e.target.value)}
              />
              {(foremanSigData || sheet?.foreman_signature) ? (
                <div className="relative">
                  <img
                    src={foremanSigData || sheet?.foreman_signature || ''}
                    alt="Foreman signature"
                    className="w-full h-20 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                  {!sheet?.foreman_signed_at && (
                    <button
                      onClick={() => { setForemanSigData(''); setShowForemanSig(true) }}
                      className="absolute top-1 right-1 text-xs text-gray-400 hover:text-red-500"
                    >Clear</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowForemanSig(true)}
                  className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-[#1a1a2e] hover:text-[#1a1a2e] transition-colors"
                >
                  Tap to sign
                </button>
              )}
              {sheet?.foreman_signed_at && (
                <p className="text-xs text-gray-400 mt-1">{new Date(sheet.foreman_signed_at).toLocaleString('en-CA')}</p>
              )}
            </div>

            {/* Superintendent */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Site Superintendent (GC)</p>
              <input
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[#1a1a2e]"
                placeholder="Superintendent name"
                value={superintendentName}
                onChange={(e) => setSuperintendentName(e.target.value)}
              />
              {(superSigData || sheet?.superintendent_signature) ? (
                <div className="relative">
                  <img
                    src={superSigData || sheet?.superintendent_signature || ''}
                    alt="Superintendent signature"
                    className="w-full h-20 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                  {!sheet?.superintendent_signed_at && (
                    <button
                      onClick={() => { setSuperSigData(''); setShowSuperSig(true) }}
                      className="absolute top-1 right-1 text-xs text-gray-400 hover:text-red-500"
                    >Clear</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSuperSig(true)}
                  className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:border-[#1a1a2e] hover:text-[#1a1a2e] transition-colors"
                >
                  Tap to sign
                </button>
              )}
              {sheet?.superintendent_signed_at && (
                <p className="text-xs text-gray-400 mt-1">{new Date(sheet.superintendent_signed_at).toLocaleString('en-CA')}</p>
              )}
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 max-w-2xl mx-auto z-40">
        <button
          onClick={() => save('draft')}
          disabled={saving}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          {saving ? '…' : 'Save Draft'}
        </button>
        <button
          onClick={() => save('pending')}
          disabled={saving}
          className="flex-1 py-2.5 bg-yellow-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          Submit
        </button>
        <button
          onClick={() => save('approved')}
          disabled={saving || !canApprove}
          className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          title={!canApprove ? 'Both signatures required' : ''}
        >
          Approve
        </button>
      </div>

      {/* Foreman signature modal */}
      {showForemanSig && (
        <SignatureModal
          title="Site Foreman Signature"
          sigRef={foremanSigRef}
          onCapture={captureForemanSig}
          onClose={() => setShowForemanSig(false)}
        />
      )}

      {/* Superintendent signature modal */}
      {showSuperSig && (
        <SignatureModal
          title="Site Superintendent Signature"
          sigRef={superSigRef}
          onCapture={captureSuperSig}
          onClose={() => setShowSuperSig(false)}
        />
      )}
    </div>
  )
}

interface SigModalProps {
  title: string
  sigRef: React.RefObject<SignatureCanvas>
  onCapture: () => void
  onClose: () => void
}

function SignatureModal({ title, sigRef, onCapture, onClose }: SigModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-2 text-center">Sign in the box below</p>
          <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{ className: 'sig-canvas w-full', height: 200 }}
              backgroundColor="white"
            />
          </div>
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => sigRef.current?.clear()}
            className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-700"
          >
            Clear
          </button>
          <button
            onClick={onCapture}
            className="flex-1 py-2 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold"
          >
            Confirm Signature
          </button>
        </div>
      </div>
    </div>
  )
}
