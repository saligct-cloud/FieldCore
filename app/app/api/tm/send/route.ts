import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Resend } from 'resend'
import React from 'react'
import { createServerClient } from '@/lib/supabase'
import { TMPdfDocument } from '@/lib/pdf'
import type { TmSheetWithItems } from '@/lib/database.types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { sheetId, pending = false } = await req.json()

  if (!sheetId) {
    return NextResponse.json({ error: 'sheetId required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const [{ data: sheet }, { data: labor }, { data: material }] = await Promise.all([
    supabase.from('tm_sheets').select('*, project:projects(*)').eq('id', sheetId).single(),
    supabase.from('labor_items').select('*').eq('tm_sheet_id', sheetId).order('item_number'),
    supabase.from('material_items').select('*').eq('tm_sheet_id', sheetId).order('item_number'),
  ])

  if (!sheet) {
    return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawSheet = sheet as any
  const project = rawSheet.project
  const emailList: string[] = (project?.email_list as string[]) ?? []

  if (emailList.length === 0) {
    return NextResponse.json({ error: 'No email recipients configured for this project' }, { status: 400 })
  }

  const sheetWithItems: TmSheetWithItems = {
    ...rawSheet,
    labor_items: labor ?? [],
    material_items: material ?? [],
    project,
  }

  const sheetNum = `T&M-${String(rawSheet.sheet_number).padStart(3, '0')}`
  const dateStr = new Date(rawSheet.date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })

  // Generate PDF
  const element = React.createElement(TMPdfDocument, { sheet: sheetWithItems, pending })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(element as any)

  const subject = `${sheetNum} — ${project?.name ?? 'Project'} — ${dateStr}${pending ? ' [PENDING APPROVAL]' : ' [APPROVED]'}`

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 18px;">DG Drywall & Construction Inc.</h2>
        <p style="margin: 4px 0 0; font-size: 13px; color: #aaa;">FieldCore — Time & Material</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 15px; font-weight: bold; margin-top: 0;">${sheetNum}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr><td style="padding: 4px 0; color: #666;">Project</td><td style="font-weight: 600;">${project?.name}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Location</td><td>${project?.location}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Status</td><td><strong style="color: ${pending ? '#b45309' : '#166534'}">${pending ? 'Pending Approval' : 'Approved'}</strong></td></tr>
          <tr><td style="padding: 4px 0; color: #666;">Grand Total</td><td style="font-weight: bold; font-size: 15px;">$${rawSheet.grand_total.toFixed(2)}</td></tr>
        </table>
        <p style="font-size: 13px; color: #555;">The T&M sheet is attached as a PDF. ${pending ? 'This sheet is pending superintendent approval.' : 'This sheet has been approved and signed.'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="font-size: 11px; color: #999;">D G Drywall & Construction Inc. · 6378 Neville Street, Burnaby BC V5E 1A6 · GST Reg. No: 859065245RT0001</p>
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@dgdrywall.ca',
    to: emailList,
    subject,
    html: bodyHtml,
    attachments: [
      {
        filename: `${sheetNum}.pdf`,
        content: Buffer.from(pdfBuffer).toString('base64'),
      },
    ],
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
