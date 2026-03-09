'use client'

import { useState } from 'react'
import type { TmSheetWithItems } from '@/lib/database.types'

interface Props {
  sheet: TmSheetWithItems
  onBack: () => void
}

export default function TmSheetView({ sheet, onBack }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  function fmt(n: number) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const sheetNum = `T&M-${String(sheet.sheet_number).padStart(3, '0')}`

  async function resendEmail() {
    setSending(true)
    await fetch('/api/tm/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: sheet.id, pending: false }),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  async function downloadPdf() {
    const res = await fetch('/api/tm/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetId: sheet.id }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sheetNum}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a1a2e] text-white px-4 py-4 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={onBack} className="text-gray-400 hover:text-white">←</button>
          <span className="text-xs text-gray-400 uppercase tracking-widest">FieldCore</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{sheetNum}</h1>
          <span className="badge-approved">Approved</span>
        </div>
        <p className="text-sm text-gray-300 mt-0.5">{sheet.project?.name}</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">
        {/* Info block */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500">Project</div>
              <div className="font-medium">{sheet.project?.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">T&M Sheet #</div>
              <div className="font-mono font-medium">{sheetNum}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Location</div>
              <div className="font-medium">{sheet.project?.location}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Date</div>
              <div className="font-medium">{new Date(sheet.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-gray-500">Subject</div>
              <div className="font-medium">{sheet.subject}</div>
            </div>
          </div>
        </div>

        {/* Labor */}
        {sheet.labor_items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#1a1a2e] text-white px-4 py-2.5 text-sm font-semibold">A — Labor</div>
            <div className="divide-y divide-gray-100">
              {sheet.labor_items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-400 mr-2">#{item.item_number}</span>
                    <span className="text-sm font-medium">{item.description}</span>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.num_workers} workers × {item.hours_per_worker}h @ {fmt(item.rate)}/hr = {item.total_hours}h
                    </div>
                  </div>
                  <div className="text-sm font-semibold ml-4">{fmt(item.line_total)}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t flex justify-between text-sm font-medium">
              <span>Labor Subtotal</span>
              <span>{fmt(sheet.labor_subtotal)}</span>
            </div>
          </div>
        )}

        {/* Material */}
        {sheet.material_items.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#1a1a2e] text-white px-4 py-2.5 text-sm font-semibold">B — Material</div>
            <div className="divide-y divide-gray-100">
              {sheet.material_items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex justify-between items-start">
                  <div>
                    <span className="text-xs text-gray-400 mr-2">#{item.item_number}</span>
                    <span className="text-sm font-medium">{item.description}</span>
                    <div className="text-xs text-gray-400 mt-1">
                      {item.quantity} {item.unit} × {fmt(item.cost_per_item)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold ml-4">{fmt(item.line_total)}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t flex justify-between text-sm font-medium">
              <span>Material Subtotal</span>
              <span>{fmt(sheet.material_subtotal)}</span>
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Labor Subtotal</span>
              <span>{fmt(sheet.labor_subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Material Subtotal</span>
              <span>{fmt(sheet.material_subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 border-t pt-2">
              <span>Subtotal</span>
              <span>{fmt(sheet.labor_subtotal + sheet.material_subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>{fmt(sheet.gst)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 text-[#1a1a2e]">
              <span>Grand Total</span>
              <span>{fmt(sheet.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1a1a2e] text-white px-4 py-2.5 text-sm font-semibold">Signatures</div>
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Site Foreman (DG)</p>
              {sheet.foreman_signature && (
                <img src={sheet.foreman_signature} alt="Foreman signature" className="w-full h-16 object-contain border border-gray-100 rounded-lg" />
              )}
              <p className="text-xs text-gray-700 mt-1 font-medium">{sheet.foreman_name}</p>
              {sheet.foreman_signed_at && (
                <p className="text-xs text-gray-400">{new Date(sheet.foreman_signed_at).toLocaleString('en-CA')}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Site Superintendent (GC)</p>
              {sheet.superintendent_signature && (
                <img src={sheet.superintendent_signature} alt="Superintendent signature" className="w-full h-16 object-contain border border-gray-100 rounded-lg" />
              )}
              <p className="text-xs text-gray-700 mt-1 font-medium">{sheet.superintendent_name}</p>
              {sheet.superintendent_signed_at && (
                <p className="text-xs text-gray-400">{new Date(sheet.superintendent_signed_at).toLocaleString('en-CA')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 max-w-2xl mx-auto z-40">
        <button
          onClick={downloadPdf}
          className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700"
        >
          Download PDF
        </button>
        <button
          onClick={resendEmail}
          disabled={sending}
          className="flex-1 py-2.5 bg-[#1a1a2e] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {sent ? 'Sent!' : sending ? 'Sending…' : 'Resend Email'}
        </button>
      </div>
    </div>
  )
}
