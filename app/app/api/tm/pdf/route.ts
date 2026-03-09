import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createServerClient } from '@/lib/supabase'
import { TMPdfDocument } from '@/lib/pdf'
import type { TmSheetWithItems } from '@/lib/database.types'

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
  const sheetWithItems: TmSheetWithItems = {
    ...rawSheet,
    labor_items: labor ?? [],
    material_items: material ?? [],
    project: rawSheet.project,
  }

  const element = React.createElement(TMPdfDocument, { sheet: sheetWithItems, pending })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  const sheetNum = `T&M-${String(rawSheet.sheet_number).padStart(3, '0')}`

  return new NextResponse(Buffer.from(buffer) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${sheetNum}.pdf"`,
    },
  })
}
