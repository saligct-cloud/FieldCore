-- FieldCore Supabase Schema
-- Run this in the Supabase SQL editor to set up the database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  gc_project_manager TEXT NOT NULL,
  contract_number TEXT,
  email_list TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- T&M Sheets table
CREATE TABLE IF NOT EXISTS tm_sheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sheet_number INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  subject TEXT DEFAULT 'Time and Material sheet for extra work performed',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved')),
  labor_subtotal NUMERIC(12,2) DEFAULT 0,
  material_subtotal NUMERIC(12,2) DEFAULT 0,
  gst NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) DEFAULT 0,
  superintendent_name TEXT,
  superintendent_signature TEXT, -- base64 image
  superintendent_signed_at TIMESTAMPTZ,
  foreman_name TEXT,
  foreman_signature TEXT, -- base64 image
  foreman_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, sheet_number)
);

-- Labor items table
CREATE TABLE IF NOT EXISTS labor_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tm_sheet_id UUID NOT NULL REFERENCES tm_sheets(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  num_workers INTEGER NOT NULL DEFAULT 1,
  hours_per_worker NUMERIC(6,2) NOT NULL DEFAULT 0,
  total_hours NUMERIC(8,2) GENERATED ALWAYS AS (num_workers * hours_per_worker) STORED,
  rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (num_workers * hours_per_worker * rate) STORED
);

-- Material items table
CREATE TABLE IF NOT EXISTS material_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tm_sheet_id UUID NOT NULL REFERENCES tm_sheets(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'EA',
  cost_per_item NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12,2) GENERATED ALWAYS AS (quantity * cost_per_item) STORED
);

-- Auto-increment sheet_number per project using a function
CREATE OR REPLACE FUNCTION next_sheet_number(p_project_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(sheet_number), 0) + 1
  FROM tm_sheets
  WHERE project_id = p_project_id;
$$ LANGUAGE SQL;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tm_sheets_updated_at
  BEFORE UPDATE ON tm_sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tm_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_items ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can do everything (single-team app)
CREATE POLICY "Authenticated users can manage projects"
  ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage tm_sheets"
  ON tm_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage labor_items"
  ON labor_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage material_items"
  ON material_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anon read-only for PDF/signature page (public signing link)
CREATE POLICY "Anon can read tm_sheets"
  ON tm_sheets FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can read labor_items"
  ON labor_items FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can read material_items"
  ON material_items FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can read projects"
  ON projects FOR SELECT TO anon USING (true);
