// Auto-generated types — replace by running:
// npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'member' | 'viewer'
          approved: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'viewer'
          approved?: boolean
          created_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'viewer'
          approved?: boolean
        }
        Relationships: []
      }
      kanban_stages: {
        Row: {
          id: string
          name: string
          position: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          position: number
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          position?: number
          color?: string
        }
        Relationships: []
      }
      plots: {
        Row: {
          id: string
          address: string
          size_sotok: number
          price_usd_per_100sqm: number | null
          owner_share_pct: number
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          project_duration_months: number | null
          legal_clearance: boolean
          zone: 'Residential' | 'Commercial' | 'Agricultural' | 'Mixed-use' | null
          stage_id: string | null
          assigned_to: string | null
          notes: string | null
          score: number | null
          score_breakdown: Json | null
          labels: Json
          position: number
          location_details: string | null
          infra_electricity: boolean | null
          infra_water: boolean | null
          infra_gas: boolean | null
          infra_sewer: boolean | null
          archived: boolean
          archived_at: string | null
          archived_by: string | null
          published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          address: string
          size_sotok: number
          price_usd_per_100sqm?: number | null
          owner_share_pct?: number
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          project_duration_months?: number | null
          legal_clearance?: boolean
          zone?: 'Residential' | 'Commercial' | 'Agricultural' | 'Mixed-use' | null
          stage_id?: string | null
          assigned_to?: string | null
          notes?: string | null
          score?: number | null
          score_breakdown?: Json | null
          labels?: Json
          position?: number
          location_details?: string | null
          infra_electricity?: boolean | null
          infra_water?: boolean | null
          infra_gas?: boolean | null
          infra_sewer?: boolean | null
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          published?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          address?: string
          size_sotok?: number
          price_usd_per_100sqm?: number | null
          owner_share_pct?: number
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          project_duration_months?: number | null
          legal_clearance?: boolean
          zone?: 'Residential' | 'Commercial' | 'Agricultural' | 'Mixed-use' | null
          stage_id?: string | null
          assigned_to?: string | null
          notes?: string | null
          score?: number | null
          score_breakdown?: Json | null
          labels?: Json
          position?: number
          location_details?: string | null
          infra_electricity?: boolean | null
          infra_water?: boolean | null
          infra_gas?: boolean | null
          infra_sewer?: boolean | null
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          published?: boolean
        }
        Relationships: []
      }
      calculator_snapshots: {
        Row: {
          id: string
          plot_id: string
          land_acquisition_cost: number | null
          construction_cost_per_sqm: number | null
          total_buildable_area_sqm: number | null
          owner_share_pct: number | null
          avg_sale_price_per_sqm: number | null
          financing_rate_pct: number | null
          tax_rate_pct: number | null
          contingency_pct: number | null
          project_duration_months: number | null
          owner_share_deduction_sqm: number | null
          effective_sellable_area_sqm: number | null
          construction_total: number | null
          financing_cost: number | null
          contingency_amount: number | null
          total_development_cost: number | null
          total_projected_revenue: number | null
          gross_profit: number | null
          net_profit: number | null
          roi_pct: number | null
          irr_pct: number | null
          breakeven_price_per_sqm: number | null
          annualized_return_pct: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          land_acquisition_cost?: number | null
          construction_cost_per_sqm?: number | null
          total_buildable_area_sqm?: number | null
          owner_share_pct?: number | null
          avg_sale_price_per_sqm?: number | null
          financing_rate_pct?: number | null
          tax_rate_pct?: number | null
          contingency_pct?: number | null
          project_duration_months?: number | null
          owner_share_deduction_sqm?: number | null
          effective_sellable_area_sqm?: number | null
          construction_total?: number | null
          financing_cost?: number | null
          contingency_amount?: number | null
          total_development_cost?: number | null
          total_projected_revenue?: number | null
          gross_profit?: number | null
          net_profit?: number | null
          roi_pct?: number | null
          irr_pct?: number | null
          breakeven_price_per_sqm?: number | null
          annualized_return_pct?: number | null
          updated_at?: string
        }
        Update: {
          land_acquisition_cost?: number | null
          construction_cost_per_sqm?: number | null
          total_buildable_area_sqm?: number | null
          owner_share_pct?: number | null
          avg_sale_price_per_sqm?: number | null
          financing_rate_pct?: number | null
          tax_rate_pct?: number | null
          contingency_pct?: number | null
          project_duration_months?: number | null
          owner_share_deduction_sqm?: number | null
          effective_sellable_area_sqm?: number | null
          construction_total?: number | null
          financing_cost?: number | null
          contingency_amount?: number | null
          total_development_cost?: number | null
          total_projected_revenue?: number | null
          gross_profit?: number | null
          net_profit?: number | null
          roi_pct?: number | null
          irr_pct?: number | null
          breakeven_price_per_sqm?: number | null
          annualized_return_pct?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      scoring_inputs: {
        Row: {
          id: string
          plot_id: string
          location_quality: number | null
          infrastructure_score: number | null
          price_vs_market_pct: number | null
          buildout_potential: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          location_quality?: number | null
          infrastructure_score?: number | null
          price_vs_market_pct?: number | null
          buildout_potential?: number | null
          updated_at?: string
        }
        Update: {
          location_quality?: number | null
          infrastructure_score?: number | null
          price_vs_market_pct?: number | null
          buildout_potential?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          id: string
          name: string
          trigger_type: string
          trigger_stage_id: string | null
          action_type: string
          enabled: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          trigger_type?: string
          trigger_stage_id?: string | null
          action_type?: string
          enabled?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          trigger_stage_id?: string | null
          enabled?: boolean
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          id: string
          rule_id: string
          title: string
          items: Json
          created_at: string
        }
        Insert: {
          id?: string
          rule_id: string
          title: string
          items?: Json
          created_at?: string
        }
        Update: {
          title?: string
          items?: Json
        }
        Relationships: []
      }
      plot_checklists: {
        Row: {
          id: string
          plot_id: string
          template_id: string | null
          rule_id: string | null
          stage_id: string | null
          title: string
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          template_id?: string | null
          rule_id?: string | null
          stage_id?: string | null
          title: string
          items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          items?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stage_change_log: {
        Row: {
          id: string
          plot_id: string
          from_stage_id: string | null
          to_stage_id: string | null
          changed_by: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          from_stage_id?: string | null
          to_stage_id?: string | null
          changed_by?: string | null
          changed_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          id: string
          name: string
          field_type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown'
          options: Json | null
          position: number
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          field_type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown'
          options?: Json | null
          position?: number
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          field_type?: 'text' | 'number' | 'date' | 'boolean' | 'dropdown'
          options?: Json | null
          position?: number
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          id: string
          plot_id: string
          field_id: string
          value_text: string | null
          value_number: number | null
          value_date: string | null
          value_boolean: boolean | null
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          field_id: string
          value_text?: string | null
          value_number?: number | null
          value_date?: string | null
          value_boolean?: boolean | null
          updated_at?: string
        }
        Update: {
          value_text?: string | null
          value_number?: number | null
          value_date?: string | null
          value_boolean?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      label_definitions: {
        Row: {
          id: string
          name: string
          color: string
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: []
      }
      plot_comments: {
        Row: {
          id: string
          plot_id: string
          body: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          body: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          body?: string
          updated_at?: string
        }
        Relationships: []
      }
      plot_activity: {
        Row: {
          id: string
          plot_id: string
          actor_id: string | null
          action_type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          actor_id?: string | null
          action_type: string
          payload?: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      plot_files: {
        Row: {
          id: string
          plot_id: string
          name: string
          size: number | null
          mime_type: string | null
          storage_path: string
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          name: string
          size?: number | null
          mime_type?: string | null
          storage_path: string
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      zone_type: 'Residential' | 'Commercial' | 'Agricultural' | 'Mixed-use'
      custom_field_type: 'text' | 'number' | 'date' | 'boolean' | 'dropdown'
    }
    CompositeTypes: Record<string, never>
  }
}
