# PRD: FieldCore — DG Drywall Time & Material App

---

## 1. Overview

**Product Name:** FieldCore
**Company:** DG Drywall & Construction Inc.
**Purpose:** A mobile-first web application that replaces the paper-based Time & Material (T&M) process. Field crews and office staff can create, manage, sign, and distribute T&M sheets digitally for extra work performed on construction sites.

**Problem Being Solved:**
Currently, T&M sheets are filled out manually on paper, signed on-site, and physically sent or scanned to the office and GC. This creates delays, lost paperwork, illegible forms, and no central record of approved extra work and its costs.

**Intended Outcome:**
A single source of truth for all T&M activity per project — with on-site digital signatures, automatic email distribution, approval tracking, and a running cost history.

---

## 2. User Personas

| Persona | Role | Primary Actions |
|---|---|---|
| **DG Foreman** | DG Drywall site foreman | Creates T&M sheets on-site, signs as Site Foreman |
| **GC Superintendent** | GC site superintendent | Reviews and signs T&M sheets as Site Superintendent |
| **DG Office / PM** | DG project manager / admin | Creates projects, manages email directories, views history and totals |

---

## 3. Core Features

### 3.1 Project Management
- Create and manage multiple projects
- Each project stores: name, location, GC project manager name, contract number, and an email distribution list
- Projects listed on the main dashboard with summary stats

### 3.2 T&M Sheet Creation & Editing
- Create a new T&M sheet within a project
- Add/edit labor line items and material line items
- Auto-incrementing T&M sheet number per project
- Save as draft, submit for signature, or mark as approved

### 3.3 Digital Signatures
- In-app signature capture for Site Superintendent (GC) and Site Foreman (DG)
- Signatures locked once both parties have signed
- Timestamp recorded with each signature

### 3.4 Approval Workflow
- Status states: **Draft → Pending Approval → Approved**
- Approved sheets are read-only and cannot be edited
- Approval status visible on the project's T&M sheet list

### 3.5 Email Distribution
- On submission or approval, automatically email the completed T&M sheet (PDF) to the project's email distribution list
- PDF output matches the existing DG Drywall T&M sheet layout

### 3.6 T&M History Per Project
- List view of all T&M sheets under a project
- Shows: sheet #, date, subject/description, status (Draft / Pending / Approved), and total cost
- Tap any sheet to view, edit (if not approved), or resend

---

## 4. Screen-by-Screen Breakdown

### Screen 1: Dashboard (Projects List)
- Header: DG Drywall logo + "FieldCore"
- List of all projects (cards)
  - Project name
  - Location
  - GC Project Manager
  - # of T&M sheets | Total approved value
- FAB button: "+ New Project"

---

### Screen 2: New / Edit Project
**Fields:**
| Field | Type | Required |
|---|---|---|
| Project Name | Text | Yes |
| Job Location | Text | Yes |
| GC Project Manager Name | Text | Yes |
| Contract # | Text | No |
| Email Distribution List | List of email addresses (add/remove) | At least 1 |

- Save / Cancel buttons

---

### Screen 3: Project Detail — T&M Sheet List
- Project header: name, location, PM, contract
- List of T&M sheets, each card showing:
  - T&M Sheet # (e.g., T&M-005)
  - Date
  - Subject / brief description
  - Status badge: Draft | Pending Approval | Approved
  - Total cost (labor + material)
- FAB button: "+ New T&M Sheet"
- Aggregate footer: Total Approved Value across all sheets

---

### Screen 4: New / Edit T&M Sheet
**Header Info (pre-populated from project, editable):**
| Field | Type |
|---|---|
| Project Name | Read-only (from project) |
| Job Location | Read-only (from project) |
| GC Project Manager | Read-only (from project) |
| Contract # | Editable text |
| T&M Sheet # | Auto-generated, read-only |
| Date | Date picker (defaults to today) |
| Subject | Text (default: "Time and Material sheet for extra work performed") |

---

**Section A — Labor**

Repeatable line items (add / remove rows):

| Column | Type |
|---|---|
| Item # | Auto-numbered |
| Labor Description | Text |
| # of Workers | Integer |
| Hours per Worker | Number (0.5 increments) |
| Total Hours | Calculated (workers × hours per worker) |
| Rate ($/hr) | Currency |
| Line Total | Calculated (total hours × rate) |

- Labor Subtotal (sum of all line totals, auto-calculated)

---

**Section B — Material**

Repeatable line items (add / remove rows):

| Column | Type |
|---|---|
| Item # | Auto-numbered |
| Material Description | Text |
| Quantity | Number |
| Unit | Text (e.g., sheets, LF, EA) |
| Cost per Item | Currency |
| Line Total | Calculated (qty × cost) |

- Material Subtotal (auto-calculated)

---

**Section C — Totals**

| Row | Value |
|---|---|
| Labor Subtotal | Calculated |
| Material Subtotal | Calculated |
| Subtotal | Labor + Material |
| GST (5%) | Calculated |
| **Grand Total** | **Calculated** |

---

**Section D — Signatures**

Two signature blocks side by side, captured on-device (hand phone/tablet to the signer):
- **Site Superintendent** (GC side): Name field + tap-to-sign pad + date auto-stamped on signing
- **Site Foreman** (DG side): Name field + tap-to-sign pad + date auto-stamped on signing

Workflow: Foreman signs first → hands device to GC superintendent → superintendent signs → sheet locks and triggers email send.

Both signatures must be captured before the sheet can be marked Approved.

---

**Actions (bottom bar):**
- Save as Draft
- Submit for Signature (sends email notification to GC superintendent if email is in directory)
- Mark as Approved (requires both signatures)
- Send / Resend PDF (triggers email to distribution list)

---

### Screen 5: T&M Sheet View (Approved, Read-Only)
- Full view of completed sheet with rendered signatures
- PDF preview / download
- Resend Email button

---

## 5. Data Model (Logical)

### Project
```
id, name, location, gc_project_manager, contract_number,
email_list[], created_at, updated_at
```

### T&M Sheet
```
id, project_id, sheet_number, date, subject, status,
labor_items[], material_items[],
labor_subtotal, material_subtotal, gst, grand_total,
superintendent_name, superintendent_signature, superintendent_signed_at,
foreman_name, foreman_signature, foreman_signed_at,
created_at, updated_at
```

### Labor Item
```
id, tm_sheet_id, item_number, description, num_workers,
hours_per_worker, total_hours, rate, line_total
```

### Material Item
```
id, tm_sheet_id, item_number, description, quantity,
unit, cost_per_item, line_total
```

---

## 6. PDF Output

The generated PDF must mirror the existing DG Drywall T&M sheet:
- DG Drywall header: logo (top right), company name, email, phone
- Project info block: Project Name, Project Manager, T&M Sheet #, Job Location, Contract, Date
- Subject line
- Labor table (Item | Labor Description | Hours | Rate | Total)
- Material table (Item | Material Description | Quantity | Cost per Item | Total)
- Totals section with GST
- Reviewed by: two signature lines (Site Superintendent | Site Foreman)
- Footer: Payable to D G Drywall & Construction Inc., 6378 Neville Street, Burnaby BC V5E 1A6, GST Reg. No: 859065245RT0001

---

## 7. Email Behavior

| Trigger | Recipients | Attachment |
|---|---|---|
| "Submit for Signature" | Project email distribution list | T&M sheet PDF (watermarked "PENDING") |
| "Mark as Approved" | Project email distribution list | Final signed T&M sheet PDF |
| "Resend" | Project email distribution list | Most recent PDF version |

Email subject line: `[T&M Sheet #] — [Project Name] — [Date]`

---

## 8. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Platform** | Mobile-first responsive web app (iOS + Android via browser; PWA installable on home screen) |
| **Offline support** | Draft creation and editing works offline; syncs when connection is restored |
| **Authentication** | Single shared login (one email + password for the entire DG team) |
| **Data persistence** | Cloud-hosted database; no data loss on device change |
| **PDF generation** | Server-side PDF generation preserving exact DG Drywall layout |
| **Signature security** | Signatures stored as base64 image; sheet locked after approval |
| **GST** | Automatically calculated at 5% (Canada) |

---

## 9. Out of Scope (v1)

- Integration with accounting software (QuickBooks, Sage)
- Change order / RFI management
- Photo attachments to T&M sheets
- Multi-company / white-label support
- In-app chat or messaging between DG and GC

---

## 10. Success Metrics

- T&M sheets created and submitted digitally (target: 100% of extra work)
- Average time to get superintendent signature (target: same day, on-site)
- Zero lost or misplaced T&M sheets
- All T&M history searchable and auditable per project

---

## 11. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Next.js 14) — mobile-first, PWA |
| Backend | Next.js API routes |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| PDF Generation | @react-pdf/renderer (server-side) |
| Email | Resend |
| Signatures | react-signature-canvas (on-device, touch-friendly) |
| Hosting | Vercel (frontend) + Supabase (DB + Auth) |
