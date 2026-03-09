export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          location: string
          gc_project_manager: string
          contract_number: string | null
          email_list: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          gc_project_manager: string
          contract_number?: string | null
          email_list?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          gc_project_manager?: string
          contract_number?: string | null
          email_list?: string[]
          updated_at?: string
        }
      }
      tm_sheets: {
        Row: {
          id: string
          project_id: string
          sheet_number: number
          date: string
          subject: string
          status: 'draft' | 'pending' | 'approved'
          labor_subtotal: number
          material_subtotal: number
          gst: number
          grand_total: number
          superintendent_name: string | null
          superintendent_signature: string | null
          superintendent_signed_at: string | null
          foreman_name: string | null
          foreman_signature: string | null
          foreman_signed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          sheet_number?: number
          date?: string
          subject?: string
          status?: 'draft' | 'pending' | 'approved'
          labor_subtotal?: number
          material_subtotal?: number
          gst?: number
          grand_total?: number
          superintendent_name?: string | null
          superintendent_signature?: string | null
          superintendent_signed_at?: string | null
          foreman_name?: string | null
          foreman_signature?: string | null
          foreman_signed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          date?: string
          subject?: string
          status?: 'draft' | 'pending' | 'approved'
          labor_subtotal?: number
          material_subtotal?: number
          gst?: number
          grand_total?: number
          superintendent_name?: string | null
          superintendent_signature?: string | null
          superintendent_signed_at?: string | null
          foreman_name?: string | null
          foreman_signature?: string | null
          foreman_signed_at?: string | null
          updated_at?: string
        }
      }
      labor_items: {
        Row: {
          id: string
          tm_sheet_id: string
          item_number: number
          description: string
          num_workers: number
          hours_per_worker: number
          total_hours: number
          rate: number
          line_total: number
        }
        Insert: {
          id?: string
          tm_sheet_id: string
          item_number: number
          description: string
          num_workers: number
          hours_per_worker: number
          total_hours: number
          rate: number
          line_total: number
        }
        Update: {
          item_number?: number
          description?: string
          num_workers?: number
          hours_per_worker?: number
          total_hours?: number
          rate?: number
          line_total?: number
        }
      }
      material_items: {
        Row: {
          id: string
          tm_sheet_id: string
          item_number: number
          description: string
          quantity: number
          unit: string
          cost_per_item: number
          line_total: number
        }
        Insert: {
          id?: string
          tm_sheet_id: string
          item_number: number
          description: string
          quantity: number
          unit: string
          cost_per_item: number
          line_total: number
        }
        Update: {
          item_number?: number
          description?: string
          quantity?: number
          unit?: string
          cost_per_item?: number
          line_total?: number
        }
      }
    }
  }
}

// Convenience types
export type Project = Database['public']['Tables']['projects']['Row']
export type TmSheet = Database['public']['Tables']['tm_sheets']['Row']
export type LaborItem = Database['public']['Tables']['labor_items']['Row']
export type MaterialItem = Database['public']['Tables']['material_items']['Row']

export type TmSheetWithItems = TmSheet & {
  labor_items: LaborItem[]
  material_items: MaterialItem[]
  project?: Project
}
