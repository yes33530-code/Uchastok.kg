import type { Database } from './database.types'

export type Plot = Database['public']['Tables']['plots']['Row']
export type PlotInsert = Database['public']['Tables']['plots']['Insert']
export type PlotUpdate = Database['public']['Tables']['plots']['Update']

export type KanbanStage = Database['public']['Tables']['kanban_stages']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type CalculatorSnapshot = Database['public']['Tables']['calculator_snapshots']['Row']
export type ScoringInputs = Database['public']['Tables']['scoring_inputs']['Row']
export type AutomationRule = Database['public']['Tables']['automation_rules']['Row']
export type ChecklistTemplate = Database['public']['Tables']['checklist_templates']['Row']
export type PlotChecklist = Database['public']['Tables']['plot_checklists']['Row']
export type CustomFieldDefinition = Database['public']['Tables']['custom_field_definitions']['Row']
export type CustomFieldValue = Database['public']['Tables']['custom_field_values']['Row']
export type PlotFile = Database['public']['Tables']['plot_files']['Row']
export type PlotComment = Database['public']['Tables']['plot_comments']['Row']
export type PlotActivity = Database['public']['Tables']['plot_activity']['Row']

// Comment with joined author profile
export type PlotCommentWithProfile = PlotComment & {
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

// Activity entry with joined actor profile
export type PlotActivityWithProfile = PlotActivity & {
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

// Extended plot with joined data
export type PlotWithStage = Plot & {
  kanban_stages: KanbanStage | null
  profiles: Profile | null
}

// Checklist item shape stored in JSONB
export interface ChecklistItem {
  label: string
  required: boolean
  checked: boolean
  checked_by: string | null
  checked_at: string | null
}

// Custom field value for forms
export interface CustomFieldEntry {
  field: CustomFieldDefinition
  value: CustomFieldValue | null
}
