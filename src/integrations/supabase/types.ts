export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assembly_elements: {
        Row: {
          assembly_id: string
          element_id: string
          id: string
        }
        Insert: {
          assembly_id: string
          element_id: string
          id?: string
        }
        Update: {
          assembly_id?: string
          element_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_elements_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "model_assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_elements_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          risk_score: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_project_setups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_logs: Json | null
          id: string
          progress_percentage: number | null
          project_id: string | null
          setup_parameters: Json
          started_at: string | null
          status: string
          steps_completed: Json | null
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_logs?: Json | null
          id?: string
          progress_percentage?: number | null
          project_id?: string | null
          setup_parameters?: Json
          started_at?: string | null
          status?: string
          steps_completed?: Json | null
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_logs?: Json | null
          id?: string
          progress_percentage?: number | null
          project_id?: string | null
          setup_parameters?: Json
          started_at?: string | null
          status?: string
          steps_completed?: Json | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automated_project_setups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automated_project_setups_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "building_type_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_location: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          file_size: number | null
          id: string
          job_type: string
          metadata: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          backup_location?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          job_type: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          backup_location?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          job_type?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      bim_elements: {
        Row: {
          created_at: string
          description: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          geometry: Json
          id: string
          ifc_element_guid: string | null
          ifc_model_id: string | null
          ifc_properties: Json | null
          material_id: string | null
          name: string
          parameters: Json
          parent_element_id: string | null
          project_id: string | null
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          geometry: Json
          id?: string
          ifc_element_guid?: string | null
          ifc_model_id?: string | null
          ifc_properties?: Json | null
          material_id?: string | null
          name: string
          parameters?: Json
          parent_element_id?: string | null
          project_id?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          element_type?: Database["public"]["Enums"]["element_type"]
          geometry?: Json
          id?: string
          ifc_element_guid?: string | null
          ifc_model_id?: string | null
          ifc_properties?: Json | null
          material_id?: string | null
          name?: string
          parameters?: Json
          parent_element_id?: string | null
          project_id?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bim_elements_ifc_model_id_fkey"
            columns: ["ifc_model_id"]
            isOneToOne: false
            referencedRelation: "ifc_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bim_elements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bim_elements_parent_element_id_fkey"
            columns: ["parent_element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bim_elements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bim_elements_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bim_elements_material_id"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bim_elements_parent_id"
            columns: ["parent_element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bim_elements_upload_id"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_uploads: {
        Row: {
          created_at: string
          file_size: number
          file_type: string
          filename: string
          id: string
          original_filename: string
          project_id: string | null
          storage_path: string
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          original_filename: string
          project_id?: string | null
          storage_path: string
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          original_filename?: string
          project_id?: string | null
          storage_path?: string
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_blueprint_uploads_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      building_type_templates: {
        Row: {
          building_type: string
          category: string
          code_requirements: Json | null
          created_at: string
          created_by: string | null
          default_parameters: Json
          description: string | null
          design_requirements: Json | null
          id: string
          is_active: boolean | null
          name: string
          required_compliance_checks: Json | null
          standard_elements: Json | null
          typical_materials: Json | null
          updated_at: string
        }
        Insert: {
          building_type: string
          category: string
          code_requirements?: Json | null
          created_at?: string
          created_by?: string | null
          default_parameters?: Json
          description?: string | null
          design_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          required_compliance_checks?: Json | null
          standard_elements?: Json | null
          typical_materials?: Json | null
          updated_at?: string
        }
        Update: {
          building_type?: string
          category?: string
          code_requirements?: Json | null
          created_at?: string
          created_by?: string | null
          default_parameters?: Json
          description?: string | null
          design_requirements?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          required_compliance_checks?: Json | null
          standard_elements?: Json | null
          typical_materials?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      client_feedback: {
        Row: {
          client_email: string
          client_name: string
          content: string
          created_at: string
          id: string
          project_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name: string
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          action_url: string | null
          client_email: string
          content: string
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          client_email: string
          content: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          action_url?: string | null
          client_email?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      collaboration_changes: {
        Row: {
          applied_at: string | null
          change_type: string
          conflict_resolved: boolean | null
          created_at: string
          element_id: string | null
          element_type: string | null
          id: string
          operation_data: Json
          operation_index: number
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          applied_at?: string | null
          change_type: string
          conflict_resolved?: boolean | null
          created_at?: string
          element_id?: string | null
          element_type?: string | null
          id?: string
          operation_data: Json
          operation_index: number
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          applied_at?: string | null
          change_type?: string
          conflict_resolved?: boolean | null
          created_at?: string
          element_id?: string | null
          element_type?: string | null
          id?: string
          operation_data?: Json
          operation_index?: number
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_changes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaboration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_level: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_level?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_permissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaboration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          project_id: string | null
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          project_id?: string | null
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string | null
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          check_type: string
          completed_at: string | null
          id: string
          metadata: Json | null
          rules_checked: number | null
          started_at: string
          status: string
          upload_id: string | null
          user_id: string
          violations_found: number | null
        }
        Insert: {
          check_type: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          rules_checked?: number | null
          started_at?: string
          status?: string
          upload_id?: string | null
          user_id: string
          violations_found?: number | null
        }
        Update: {
          check_type?: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          rules_checked?: number | null
          started_at?: string
          status?: string
          upload_id?: string | null
          user_id?: string
          violations_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          created_at: string
          file_path: string | null
          findings: Json | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          recommendations: Json | null
          report_type: string
          status: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          findings?: Json | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          recommendations?: Json | null
          report_type: string
          status?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          findings?: Json | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          recommendations?: Json | null
          report_type?: string
          status?: string
        }
        Relationships: []
      }
      compliance_rules: {
        Row: {
          code_section: string
          created_at: string
          description: string
          id: string
          is_active: boolean
          jurisdiction: string
          rule_logic: Json
          rule_type: string
          title: string
          updated_at: string
        }
        Insert: {
          code_section: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          jurisdiction: string
          rule_logic: Json
          rule_type: string
          title: string
          updated_at?: string
        }
        Update: {
          code_section?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          jurisdiction?: string
          rule_logic?: Json
          rule_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_violations: {
        Row: {
          current_value: Json | null
          description: string
          detected_at: string
          element_id: string | null
          id: string
          location: Json | null
          remediation_suggestions: string[] | null
          required_value: Json | null
          resolved_at: string | null
          rule_id: string
          severity: string
          status: string
          upload_id: string | null
          violation_type: string
        }
        Insert: {
          current_value?: Json | null
          description: string
          detected_at?: string
          element_id?: string | null
          id?: string
          location?: Json | null
          remediation_suggestions?: string[] | null
          required_value?: Json | null
          resolved_at?: string | null
          rule_id: string
          severity: string
          status?: string
          upload_id?: string | null
          violation_type: string
        }
        Update: {
          current_value?: Json | null
          description?: string
          detected_at?: string
          element_id?: string | null
          id?: string
          location?: Json | null
          remediation_suggestions?: string[] | null
          required_value?: Json | null
          resolved_at?: string | null
          rule_id?: string
          severity?: string
          status?: string
          upload_id?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "compliance_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      detection_results: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          detected_objects: Json
          error_message: string | null
          id: string
          is_ai_generated: boolean | null
          metadata: Json | null
          model_used: string | null
          processing_method: string | null
          processing_time_ms: number | null
          upload_id: string
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          detected_objects: Json
          error_message?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          processing_method?: string | null
          processing_time_ms?: number | null
          upload_id: string
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          detected_objects?: Json
          error_message?: string | null
          id?: string
          is_ai_generated?: boolean | null
          metadata?: Json | null
          model_used?: string | null
          processing_method?: string | null
          processing_time_ms?: number | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detection_results_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_exports: {
        Row: {
          ai_generated_content: Json | null
          completed_at: string | null
          document_type: string
          error_message: string | null
          file_path: string | null
          file_size: number | null
          format_type: string
          generated_at: string
          generated_by: string
          generation_data: Json
          id: string
          status: string
          template_id: string | null
          title: string
          upload_id: string | null
        }
        Insert: {
          ai_generated_content?: Json | null
          completed_at?: string | null
          document_type: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          format_type: string
          generated_at?: string
          generated_by: string
          generation_data?: Json
          id?: string
          status?: string
          template_id?: string | null
          title: string
          upload_id?: string | null
        }
        Update: {
          ai_generated_content?: Json | null
          completed_at?: string | null
          document_type?: string
          error_message?: string | null
          file_path?: string | null
          file_size?: number | null
          format_type?: string
          generated_at?: string
          generated_by?: string
          generation_data?: Json
          id?: string
          status?: string
          template_id?: string | null
          title?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_exports_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          format_type: string
          id: string
          is_active: boolean
          name: string
          template_content: Json
          template_type: string
          updated_at: string
          variables: Json
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          format_type: string
          id?: string
          is_active?: boolean
          name: string
          template_content: Json
          template_type: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          format_type?: string
          id?: string
          is_active?: boolean
          name?: string
          template_content?: Json
          template_type?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      document_variables: {
        Row: {
          created_at: string
          data_source: string | null
          export_id: string
          id: string
          variable_name: string
          variable_value: Json
        }
        Insert: {
          created_at?: string
          data_source?: string | null
          export_id: string
          id?: string
          variable_name: string
          variable_value: Json
        }
        Update: {
          created_at?: string
          data_source?: string | null
          export_id?: string
          id?: string
          variable_name?: string
          variable_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_variables_export_id_fkey"
            columns: ["export_id"]
            isOneToOne: false
            referencedRelation: "document_exports"
            referencedColumns: ["id"]
          },
        ]
      }
      element_constraints: {
        Row: {
          constraint_data: Json
          constraint_type: Database["public"]["Enums"]["constraint_type"]
          created_at: string
          element_id: string
          id: string
          is_active: boolean | null
          target_element_id: string | null
        }
        Insert: {
          constraint_data: Json
          constraint_type: Database["public"]["Enums"]["constraint_type"]
          created_at?: string
          element_id: string
          id?: string
          is_active?: boolean | null
          target_element_id?: string | null
        }
        Update: {
          constraint_data?: Json
          constraint_type?: Database["public"]["Enums"]["constraint_type"]
          created_at?: string
          element_id?: string
          id?: string
          is_active?: boolean | null
          target_element_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "element_constraints_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "element_constraints_target_element_id_fkey"
            columns: ["target_element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_purpose: string
          key_type: string
          last_rotated: string | null
          next_rotation: string | null
          rotation_schedule: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_purpose: string
          key_type: string
          last_rotated?: string | null
          next_rotation?: string | null
          rotation_schedule?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_purpose?: string
          key_type?: string
          last_rotated?: string | null
          next_rotation?: string | null
          rotation_schedule?: string | null
        }
        Relationships: []
      }
      fea_analyses: {
        Row: {
          analysis_type: Database["public"]["Enums"]["analysis_type"]
          completed_at: string | null
          created_at: string
          description: string | null
          element_id: string | null
          id: string
          input_parameters: Json
          name: string
          started_at: string | null
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string
          upload_id: string | null
          user_id: string
        }
        Insert: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          element_id?: string | null
          id?: string
          input_parameters?: Json
          name: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          upload_id?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: Database["public"]["Enums"]["analysis_type"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          element_id?: string | null
          id?: string
          input_parameters?: Json
          name?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
          upload_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fea_analyses_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "bim_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fea_analyses_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      fea_boundary_conditions: {
        Row: {
          analysis_id: string
          condition_type: Database["public"]["Enums"]["boundary_condition_type"]
          constraints: Json
          created_at: string
          id: string
          location: Json
          name: string
          properties: Json | null
        }
        Insert: {
          analysis_id: string
          condition_type: Database["public"]["Enums"]["boundary_condition_type"]
          constraints: Json
          created_at?: string
          id?: string
          location: Json
          name: string
          properties?: Json | null
        }
        Update: {
          analysis_id?: string
          condition_type?: Database["public"]["Enums"]["boundary_condition_type"]
          constraints?: Json
          created_at?: string
          id?: string
          location?: Json
          name?: string
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fea_boundary_conditions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "fea_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      fea_loads: {
        Row: {
          analysis_id: string
          created_at: string
          direction: Json
          id: string
          load_type: Database["public"]["Enums"]["load_type"]
          location: Json
          magnitude: number
          name: string
          properties: Json | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          direction: Json
          id?: string
          load_type: Database["public"]["Enums"]["load_type"]
          location: Json
          magnitude: number
          name: string
          properties?: Json | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          direction?: Json
          id?: string
          load_type?: Database["public"]["Enums"]["load_type"]
          location?: Json
          magnitude?: number
          name?: string
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fea_loads_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "fea_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      fea_meshes: {
        Row: {
          analysis_id: string
          created_at: string
          element_type: string
          elements: Json
          id: string
          nodes: Json
          properties: Json | null
        }
        Insert: {
          analysis_id: string
          created_at?: string
          element_type: string
          elements: Json
          id?: string
          nodes: Json
          properties?: Json | null
        }
        Update: {
          analysis_id?: string
          created_at?: string
          element_type?: string
          elements?: Json
          id?: string
          nodes?: Json
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fea_meshes_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "fea_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      fea_results: {
        Row: {
          analysis_id: string
          created_at: string
          data: Json
          file_path: string | null
          id: string
          metadata: Json | null
          result_type: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          data: Json
          file_path?: string | null
          id?: string
          metadata?: Json | null
          result_type: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          data?: Json
          file_path?: string | null
          id?: string
          metadata?: Json | null
          result_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fea_results_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "fea_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_3d_models: {
        Row: {
          created_at: string
          file_size: number
          generation_prompt: string | null
          generation_status: string
          id: string
          model_description: string | null
          model_file_path: string
          model_name: string
          processing_time_ms: number | null
          updated_at: string
          upload_id: string
        }
        Insert: {
          created_at?: string
          file_size: number
          generation_prompt?: string | null
          generation_status?: string
          id?: string
          model_description?: string | null
          model_file_path: string
          model_name: string
          processing_time_ms?: number | null
          updated_at?: string
          upload_id: string
        }
        Update: {
          created_at?: string
          file_size?: number
          generation_prompt?: string | null
          generation_status?: string
          id?: string
          model_description?: string | null
          model_file_path?: string
          model_name?: string
          processing_time_ms?: number | null
          updated_at?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_3d_models_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      gis_data_updates: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          layer_id: string | null
          processed_at: string | null
          processing_status: string
          update_data: Json
          update_source: string
          update_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          layer_id?: string | null
          processed_at?: string | null
          processing_status?: string
          update_data: Json
          update_source: string
          update_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          layer_id?: string | null
          processed_at?: string | null
          processing_status?: string
          update_data?: Json
          update_source?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gis_data_updates_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "gis_layers"
            referencedColumns: ["id"]
          },
        ]
      }
      gis_layers: {
        Row: {
          bbox: Json | null
          city: string
          coordinate_system: string | null
          created_at: string
          data_freshness_hours: number | null
          data_size: number | null
          description: string | null
          environmental_type: string | null
          feature_count: number | null
          geometry_data: Json | null
          id: string
          last_updated: string
          layer_name: string
          layer_type: string
          metadata: Json | null
          processing_status: string | null
          real_time_enabled: boolean | null
          source_url: string
          state: string
          status: string
          update_frequency: string | null
        }
        Insert: {
          bbox?: Json | null
          city: string
          coordinate_system?: string | null
          created_at?: string
          data_freshness_hours?: number | null
          data_size?: number | null
          description?: string | null
          environmental_type?: string | null
          feature_count?: number | null
          geometry_data?: Json | null
          id?: string
          last_updated?: string
          layer_name: string
          layer_type: string
          metadata?: Json | null
          processing_status?: string | null
          real_time_enabled?: boolean | null
          source_url: string
          state: string
          status?: string
          update_frequency?: string | null
        }
        Update: {
          bbox?: Json | null
          city?: string
          coordinate_system?: string | null
          created_at?: string
          data_freshness_hours?: number | null
          data_size?: number | null
          description?: string | null
          environmental_type?: string | null
          feature_count?: number | null
          geometry_data?: Json | null
          id?: string
          last_updated?: string
          layer_name?: string
          layer_type?: string
          metadata?: Json | null
          processing_status?: string | null
          real_time_enabled?: boolean | null
          source_url?: string
          state?: string
          status?: string
          update_frequency?: string | null
        }
        Relationships: []
      }
      ifc_generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json
          output_file_path: string | null
          processing_time_ms: number | null
          status: string
          upload_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data: Json
          output_file_path?: string | null
          processing_time_ms?: number | null
          status?: string
          upload_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          output_file_path?: string | null
          processing_time_ms?: number | null
          status?: string
          upload_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifc_generation_jobs_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      ifc_models: {
        Row: {
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          id: string
          model_metadata: Json | null
          name: string
          processed_at: string | null
          project_id: string | null
          updated_at: string
          upload_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          id?: string
          model_metadata?: Json | null
          name: string
          processed_at?: string | null
          project_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          id?: string
          model_metadata?: Json | null
          name?: string
          processed_at?: string | null
          project_id?: string | null
          updated_at?: string
          upload_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ifc_models_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          added_by: string | null
          created_at: string
          description: string | null
          id: string
          ip_address: unknown
          ip_range: unknown | null
          is_active: boolean | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address: unknown
          ip_range?: unknown | null
          is_active?: boolean | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: unknown
          ip_range?: unknown | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      jurisdiction_codes: {
        Row: {
          adoption_date: string
          amendments: Json | null
          code_name: string
          code_type: string
          code_version: string
          created_at: string
          effective_date: string
          id: string
          is_current: boolean
          jurisdiction_id: string
          superseded_by: string | null
        }
        Insert: {
          adoption_date: string
          amendments?: Json | null
          code_name: string
          code_type: string
          code_version: string
          created_at?: string
          effective_date: string
          id?: string
          is_current?: boolean
          jurisdiction_id: string
          superseded_by?: string | null
        }
        Update: {
          adoption_date?: string
          amendments?: Json | null
          code_name?: string
          code_type?: string
          code_version?: string
          created_at?: string
          effective_date?: string
          id?: string
          is_current?: boolean
          jurisdiction_id?: string
          superseded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdiction_codes_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jurisdiction_codes_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "jurisdiction_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      jurisdictions: {
        Row: {
          city_name: string | null
          code_adoption_date: string | null
          contact_info: Json | null
          county_name: string | null
          created_at: string
          id: string
          is_active: boolean
          jurisdiction_type: string
          last_updated: string
          name: string
          parent_jurisdiction_id: string | null
          state_code: string
          website_url: string | null
        }
        Insert: {
          city_name?: string | null
          code_adoption_date?: string | null
          contact_info?: Json | null
          county_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          jurisdiction_type: string
          last_updated?: string
          name: string
          parent_jurisdiction_id?: string | null
          state_code: string
          website_url?: string | null
        }
        Update: {
          city_name?: string | null
          code_adoption_date?: string | null
          contact_info?: Json | null
          county_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          jurisdiction_type?: string
          last_updated?: string
          name?: string
          parent_jurisdiction_id?: string | null
          state_code?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jurisdictions_parent_jurisdiction_id_fkey"
            columns: ["parent_jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      load_calculations: {
        Row: {
          created_at: string
          id: string
          parameters: Json
          results: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parameters: Json
          results: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parameters?: Json
          results?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          id: string
          material_type: Database["public"]["Enums"]["material_type"]
          name: string
          properties: Json
          supplier: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          material_type: Database["public"]["Enums"]["material_type"]
          name: string
          properties?: Json
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          material_type?: Database["public"]["Enums"]["material_type"]
          name?: string
          properties?: Json
          supplier?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      model_assemblies: {
        Row: {
          assembly_type: string
          created_at: string
          id: string
          name: string
          properties: Json | null
          updated_at: string
          upload_id: string
        }
        Insert: {
          assembly_type: string
          created_at?: string
          id?: string
          name: string
          properties?: Json | null
          updated_at?: string
          upload_id: string
        }
        Update: {
          assembly_type?: string
          created_at?: string
          id?: string
          name?: string
          properties?: Json | null
          updated_at?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_assemblies_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "blueprint_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          organization: string | null
          phone: string | null
          role_id: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          organization?: string | null
          phone?: string | null
          role_id?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          organization?: string | null
          phone?: string | null
          role_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_branches: {
        Row: {
          created_at: string
          created_by: string
          current_snapshot_id: string | null
          description: string | null
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_snapshot_id?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_snapshot_id?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_branches_current_snapshot_id_fkey"
            columns: ["current_snapshot_id"]
            isOneToOne: false
            referencedRelation: "project_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_branches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress: {
        Row: {
          created_at: string
          id: string
          milestones: Json | null
          progress_percentage: number
          project_id: string
          recent_updates: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          milestones?: Json | null
          progress_percentage?: number
          project_id: string
          recent_updates?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          milestones?: Json | null
          progress_percentage?: number
          project_id?: string
          recent_updates?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          message: string | null
          permissions: Json
          project_id: string
          shared_by: string
          shared_with_email: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          permissions?: Json
          project_id: string
          shared_by: string
          shared_with_email: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          permissions?: Json
          project_id?: string
          shared_by?: string
          shared_with_email?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_snapshots: {
        Row: {
          branch_name: string
          created_at: string
          description: string | null
          id: string
          is_current: boolean
          metadata: Json
          parent_snapshot_id: string | null
          project_id: string
          snapshot_data: Json
          snapshot_name: string
          user_id: string
        }
        Insert: {
          branch_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean
          metadata?: Json
          parent_snapshot_id?: string | null
          project_id: string
          snapshot_data: Json
          snapshot_name: string
          user_id: string
        }
        Update: {
          branch_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_current?: boolean
          metadata?: Json
          parent_snapshot_id?: string | null
          project_id?: string
          snapshot_data?: Json
          snapshot_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_snapshots_parent_snapshot_id_fkey"
            columns: ["parent_snapshot_id"]
            isOneToOne: false
            referencedRelation: "project_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_workflows: {
        Row: {
          automation_config: Json | null
          created_at: string
          created_by: string | null
          current_step: number | null
          id: string
          name: string
          progress_data: Json | null
          project_id: string | null
          status: string
          steps: Json
          template_id: string | null
          updated_at: string
        }
        Insert: {
          automation_config?: Json | null
          created_at?: string
          created_by?: string | null
          current_step?: number | null
          id?: string
          name: string
          progress_data?: Json | null
          project_id?: string | null
          status?: string
          steps?: Json
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          automation_config?: Json | null
          created_at?: string
          created_by?: string | null
          current_step?: number | null
          id?: string
          name?: string
          progress_data?: Json | null
          project_id?: string | null
          status?: string
          steps?: Json
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflows_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      property_boundaries: {
        Row: {
          area_sqft: number | null
          boundary_geometry: Json
          city: string
          county: string | null
          created_at: string
          environmental_constraints: Json | null
          flood_zone: string | null
          id: string
          last_surveyed: string | null
          owner_name: string | null
          parcel_id: string
          property_address: string | null
          soil_type: string | null
          state: string
          updated_at: string
          zoning_designation: string | null
        }
        Insert: {
          area_sqft?: number | null
          boundary_geometry: Json
          city: string
          county?: string | null
          created_at?: string
          environmental_constraints?: Json | null
          flood_zone?: string | null
          id?: string
          last_surveyed?: string | null
          owner_name?: string | null
          parcel_id: string
          property_address?: string | null
          soil_type?: string | null
          state: string
          updated_at?: string
          zoning_designation?: string | null
        }
        Update: {
          area_sqft?: number | null
          boundary_geometry?: Json
          city?: string
          county?: string | null
          created_at?: string
          environmental_constraints?: Json | null
          flood_zone?: string | null
          id?: string
          last_surveyed?: string | null
          owner_name?: string | null
          parcel_id?: string
          property_address?: string | null
          soil_type?: string | null
          state?: string
          updated_at?: string
          zoning_designation?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: number
          role_name: string
        }
        Insert: {
          id?: number
          role_name: string
        }
        Update: {
          id?: number
          role_name?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      spatial_analysis_results: {
        Row: {
          analysis_type: string
          created_at: string | null
          id: string
          input_layer_ids: string[]
          parameters: Json | null
          result_data: Json
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string | null
          id?: string
          input_layer_ids: string[]
          parameters?: Json | null
          result_data: Json
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string | null
          id?: string
          input_layer_ids?: string[]
          parameters?: Json | null
          result_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          cursor_position: Json | null
          id: string
          is_active: boolean
          last_seen: string
          session_id: string | null
          user_color: string
          user_id: string | null
        }
        Insert: {
          cursor_position?: Json | null
          id?: string
          is_active?: boolean
          last_seen?: string
          session_id?: string | null
          user_color?: string
          user_id?: string | null
        }
        Update: {
          cursor_position?: Json | null
          id?: string
          is_active?: boolean
          last_seen?: string
          session_id?: string | null
          user_color?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "collaboration_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity: string | null
          location: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity?: string | null
          location?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          started_at: string | null
          status: string
          step_index: number
          step_name: string
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_index: number
          step_name: string
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          started_at?: string | null
          status?: string
          step_index?: number
          step_name?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "project_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          automation_rules: Json | null
          building_type: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          name: string
          parameters: Json
          steps: Json
          template_data: Json
          updated_at: string
        }
        Insert: {
          automation_rules?: Json | null
          building_type?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name: string
          parameters?: Json
          steps?: Json
          template_data?: Json
          updated_at?: string
        }
        Update: {
          automation_rules?: Json | null
          building_type?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          name?: string
          parameters?: Json
          steps?: Json
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered: string | null
          trigger_config: Json
          trigger_type: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_config?: Json
          trigger_type: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          trigger_config?: Json
          trigger_type?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_triggers_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "project_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_compliance_checks: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_presence: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_workflow_step: {
        Args: {
          p_execution_id: string
          p_output_data?: Json
          p_success?: boolean
          p_error_message?: string
        }
        Returns: boolean
      }
      execute_workflow_step: {
        Args: {
          p_workflow_id: string
          p_step_index: number
          p_input_data?: Json
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_resource_type: string
          p_resource_id?: string
          p_details?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_severity: string
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
    }
    Enums: {
      analysis_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      analysis_type: "static" | "modal" | "buckling" | "thermal" | "dynamic"
      boundary_condition_type:
        | "fixed"
        | "pinned"
        | "roller"
        | "free"
        | "symmetry"
      constraint_type:
        | "dimensional"
        | "geometric"
        | "material"
        | "structural"
        | "thermal"
      element_type:
        | "wall"
        | "beam"
        | "column"
        | "slab"
        | "door"
        | "window"
        | "roof"
        | "foundation"
        | "stair"
        | "railing"
        | "mechanical"
        | "electrical"
        | "plumbing"
        | "structural"
        | "architectural"
      load_type:
        | "point_load"
        | "distributed_load"
        | "moment"
        | "pressure"
        | "temperature"
        | "gravity"
      material_type:
        | "concrete"
        | "steel"
        | "wood"
        | "glass"
        | "aluminum"
        | "brick"
        | "stone"
        | "composite"
        | "insulation"
        | "drywall"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      analysis_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      analysis_type: ["static", "modal", "buckling", "thermal", "dynamic"],
      boundary_condition_type: [
        "fixed",
        "pinned",
        "roller",
        "free",
        "symmetry",
      ],
      constraint_type: [
        "dimensional",
        "geometric",
        "material",
        "structural",
        "thermal",
      ],
      element_type: [
        "wall",
        "beam",
        "column",
        "slab",
        "door",
        "window",
        "roof",
        "foundation",
        "stair",
        "railing",
        "mechanical",
        "electrical",
        "plumbing",
        "structural",
        "architectural",
      ],
      load_type: [
        "point_load",
        "distributed_load",
        "moment",
        "pressure",
        "temperature",
        "gravity",
      ],
      material_type: [
        "concrete",
        "steel",
        "wood",
        "glass",
        "aluminum",
        "brick",
        "stone",
        "composite",
        "insulation",
        "drywall",
      ],
    },
  },
} as const
