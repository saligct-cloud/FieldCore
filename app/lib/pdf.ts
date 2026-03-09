import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import React from 'react'
import type { TmSheetWithItems } from './database.types'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 36,
    color: '#000',
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companyBlock: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: '#333',
  },
  tmTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    border: '1pt solid #000',
    marginBottom: 8,
  },
  infoCell: {
    width: '50%',
    padding: 4,
    borderRight: '1pt solid #000',
    borderBottom: '1pt solid #000',
  },
  infoCellFull: {
    width: '100%',
    padding: 4,
    borderBottom: '1pt solid #000',
  },
  infoLabel: {
    fontSize: 7,
    color: '#555',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  // Section headers
  sectionHeader: {
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '4 6',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 0,
  },
  // Tables
  table: {
    border: '1pt solid #000',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottom: '1pt solid #000',
  },
  th: {
    padding: '3 4',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    borderRight: '0.5pt solid #ccc',
  },
  td: {
    padding: '3 4',
    fontSize: 8,
    borderRight: '0.5pt solid #ccc',
  },
  tdRight: {
    padding: '3 4',
    fontSize: 8,
    borderRight: '0.5pt solid #ccc',
    textAlign: 'right',
  },
  // Column widths - Labor
  colLaborNum: { width: '5%' },
  colLaborDesc: { width: '35%' },
  colLaborWorkers: { width: '10%' },
  colLaborHrs: { width: '12%' },
  colLaborTotalHrs: { width: '12%' },
  colLaborRate: { width: '13%' },
  colLaborTotal: { width: '13%' },
  // Column widths - Material
  colMatNum: { width: '5%' },
  colMatDesc: { width: '40%' },
  colMatQty: { width: '12%' },
  colMatUnit: { width: '10%' },
  colMatCost: { width: '16%' },
  colMatTotal: { width: '17%' },
  // Totals
  totalsBlock: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  totalsTable: {
    width: '40%',
    border: '1pt solid #000',
  },
  totalsRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #ccc',
    justifyContent: 'space-between',
    padding: '3 6',
  },
  totalsRowGrand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '4 6',
    backgroundColor: '#1a1a2e',
  },
  totalsLabel: { fontSize: 8 },
  totalsValue: { fontSize: 8, textAlign: 'right' },
  totalsLabelGrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff' },
  totalsValueGrand: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#fff', textAlign: 'right' },
  // Signatures
  signatureSection: {
    marginTop: 8,
    border: '1pt solid #000',
    padding: 8,
  },
  signatureTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  signatureBlock: {
    flex: 1,
    borderTop: '1pt solid #000',
    paddingTop: 6,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  signatureImage: {
    height: 50,
    objectFit: 'contain',
    marginBottom: 4,
  },
  signatureLine: {
    borderBottom: '0.5pt solid #999',
    marginBottom: 3,
    height: 50,
  },
  signatureNameLine: {
    fontSize: 8,
    color: '#333',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTop: '0.5pt solid #ccc',
    paddingTop: 4,
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    fontSize: 72,
    color: 'rgba(255,0,0,0.1)',
    fontFamily: 'Helvetica-Bold',
    transform: 'rotate(-45deg)',
  },
})

function fmt(n: number) {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

interface TMPdfProps {
  sheet: TmSheetWithItems
  pending?: boolean
}

export function TMPdfDocument({ sheet, pending = false }: TMPdfProps) {
  const project = sheet.project
  const sheetNum = `T&M-${String(sheet.sheet_number).padStart(3, '0')}`

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // Watermark
      pending
        ? React.createElement(Text, { style: styles.watermark }, 'PENDING')
        : null,

      // Header
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(
          View,
          { style: styles.companyBlock },
          React.createElement(Text, { style: styles.companyName }, 'DG Drywall & Construction Inc.'),
          React.createElement(Text, { style: styles.companyDetail }, 'info@dgdrywall.ca | (604) 555-0100'),
          React.createElement(Text, { style: styles.companyDetail }, '6378 Neville Street, Burnaby BC V5E 1A6'),
          React.createElement(Text, { style: styles.companyDetail }, 'GST Reg. No: 859065245RT0001')
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.tmTitle }, 'TIME & MATERIAL'),
          React.createElement(Text, { style: { fontSize: 11, textAlign: 'right', color: '#555' } }, sheetNum)
        )
      ),

      // Info grid
      React.createElement(
        View,
        { style: styles.infoGrid },
        React.createElement(
          View,
          { style: styles.infoCell },
          React.createElement(Text, { style: styles.infoLabel }, 'PROJECT NAME'),
          React.createElement(Text, { style: styles.infoValue }, project?.name || '')
        ),
        React.createElement(
          View,
          { style: { ...styles.infoCell, borderRight: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'T&M SHEET #'),
          React.createElement(Text, { style: styles.infoValue }, sheetNum)
        ),
        React.createElement(
          View,
          { style: styles.infoCell },
          React.createElement(Text, { style: styles.infoLabel }, 'JOB LOCATION'),
          React.createElement(Text, { style: styles.infoValue }, project?.location || '')
        ),
        React.createElement(
          View,
          { style: { ...styles.infoCell, borderRight: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'DATE'),
          React.createElement(Text, { style: styles.infoValue }, sheet.date)
        ),
        React.createElement(
          View,
          { style: styles.infoCell },
          React.createElement(Text, { style: styles.infoLabel }, 'GC PROJECT MANAGER'),
          React.createElement(Text, { style: styles.infoValue }, project?.gc_project_manager || '')
        ),
        React.createElement(
          View,
          { style: { ...styles.infoCell, borderRight: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'CONTRACT #'),
          React.createElement(Text, { style: styles.infoValue }, project?.contract_number || '—')
        ),
        React.createElement(
          View,
          { style: { ...styles.infoCellFull, borderBottom: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'SUBJECT'),
          React.createElement(Text, { style: styles.infoValue }, sheet.subject)
        )
      ),

      // Labor Section
      React.createElement(Text, { style: styles.sectionHeader }, 'A  —  LABOR'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeaderRow },
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborNum } }, '#'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborDesc } }, 'LABOR DESCRIPTION'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborWorkers } }, 'WORKERS'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborHrs } }, 'HRS/WORKER'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborTotalHrs } }, 'TOTAL HRS'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborRate } }, 'RATE ($/HR)'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colLaborTotal, borderRight: 0 } }, 'LINE TOTAL')
        ),
        ...(sheet.labor_items.length > 0
          ? sheet.labor_items.map((item, i) =>
              React.createElement(
                View,
                { key: item.id, style: i === sheet.labor_items.length - 1 ? styles.tableRowLast : styles.tableRow },
                React.createElement(Text, { style: { ...styles.td, ...styles.colLaborNum } }, String(item.item_number)),
                React.createElement(Text, { style: { ...styles.td, ...styles.colLaborDesc } }, item.description),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colLaborWorkers } }, String(item.num_workers)),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colLaborHrs } }, item.hours_per_worker.toFixed(1)),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colLaborTotalHrs } }, item.total_hours.toFixed(1)),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colLaborRate } }, fmt(item.rate)),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colLaborTotal, borderRight: 0 } }, fmt(item.line_total))
              )
            )
          : [React.createElement(
              View,
              { key: 'empty', style: styles.tableRowLast },
              React.createElement(Text, { style: { ...styles.td, width: '100%', color: '#999' } }, 'No labor items')
            )]
        )
      ),

      // Material Section
      React.createElement(Text, { style: styles.sectionHeader }, 'B  —  MATERIAL'),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeaderRow },
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatNum } }, '#'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatDesc } }, 'MATERIAL DESCRIPTION'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatQty } }, 'QTY'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatUnit } }, 'UNIT'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatCost } }, 'COST / ITEM'),
          React.createElement(Text, { style: { ...styles.th, ...styles.colMatTotal, borderRight: 0 } }, 'LINE TOTAL')
        ),
        ...(sheet.material_items.length > 0
          ? sheet.material_items.map((item, i) =>
              React.createElement(
                View,
                { key: item.id, style: i === sheet.material_items.length - 1 ? styles.tableRowLast : styles.tableRow },
                React.createElement(Text, { style: { ...styles.td, ...styles.colMatNum } }, String(item.item_number)),
                React.createElement(Text, { style: { ...styles.td, ...styles.colMatDesc } }, item.description),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colMatQty } }, item.quantity.toString()),
                React.createElement(Text, { style: { ...styles.td, ...styles.colMatUnit } }, item.unit),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colMatCost } }, fmt(item.cost_per_item)),
                React.createElement(Text, { style: { ...styles.tdRight, ...styles.colMatTotal, borderRight: 0 } }, fmt(item.line_total))
              )
            )
          : [React.createElement(
              View,
              { key: 'empty', style: styles.tableRowLast },
              React.createElement(Text, { style: { ...styles.td, width: '100%', color: '#999' } }, 'No material items')
            )]
        )
      ),

      // Totals
      React.createElement(
        View,
        { style: styles.totalsBlock },
        React.createElement(
          View,
          { style: styles.totalsTable },
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'Labor Subtotal'),
            React.createElement(Text, { style: styles.totalsValue }, fmt(sheet.labor_subtotal))
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'Material Subtotal'),
            React.createElement(Text, { style: styles.totalsValue }, fmt(sheet.material_subtotal))
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'Subtotal'),
            React.createElement(Text, { style: styles.totalsValue }, fmt(sheet.labor_subtotal + sheet.material_subtotal))
          ),
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(Text, { style: styles.totalsLabel }, 'GST (5%)'),
            React.createElement(Text, { style: styles.totalsValue }, fmt(sheet.gst))
          ),
          React.createElement(
            View,
            { style: styles.totalsRowGrand },
            React.createElement(Text, { style: styles.totalsLabelGrand }, 'GRAND TOTAL'),
            React.createElement(Text, { style: styles.totalsValueGrand }, fmt(sheet.grand_total))
          )
        )
      ),

      // Signatures
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(Text, { style: styles.signatureTitle }, 'REVIEWED & APPROVED BY'),
        React.createElement(
          View,
          { style: styles.signatureRow },
          // Superintendent
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, 'Site Superintendent (GC)'),
            sheet.superintendent_signature
              ? React.createElement(Image, { style: styles.signatureImage, src: sheet.superintendent_signature })
              : React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureNameLine }, sheet.superintendent_name || 'Name: ________________________'),
            sheet.superintendent_signed_at
              ? React.createElement(Text, { style: { ...styles.signatureNameLine, marginTop: 2 } }, `Date: ${new Date(sheet.superintendent_signed_at).toLocaleDateString('en-CA')}`)
              : React.createElement(Text, { style: styles.signatureNameLine }, 'Date: ________________________')
          ),
          // Foreman
          React.createElement(
            View,
            { style: { ...styles.signatureBlock, marginLeft: 20 } },
            React.createElement(Text, { style: styles.signatureLabel }, 'Site Foreman (DG Drywall)'),
            sheet.foreman_signature
              ? React.createElement(Image, { style: styles.signatureImage, src: sheet.foreman_signature })
              : React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureNameLine }, sheet.foreman_name || 'Name: ________________________'),
            sheet.foreman_signed_at
              ? React.createElement(Text, { style: { ...styles.signatureNameLine, marginTop: 2 } }, `Date: ${new Date(sheet.foreman_signed_at).toLocaleDateString('en-CA')}`)
              : React.createElement(Text, { style: styles.signatureNameLine }, 'Date: ________________________')
          )
        )
      ),

      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        'Payable to D G Drywall & Construction Inc.  |  6378 Neville Street, Burnaby BC V5E 1A6  |  GST Reg. No: 859065245RT0001'
      )
    )
  )
}
