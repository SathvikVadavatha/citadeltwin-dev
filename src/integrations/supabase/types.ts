export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      bim_elements: {
        Row: {
          created_at: string
          description: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          geometry: Json
          id: string
          material_id: string | null
          name: string
          parameters: Json
          parent_element_id: string | null
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          element_type: Database["public"]["Enums"]["element_type"]
          geometry: Json
          id?: string
          material_id?: string | null
          name: string
          parameters?: Json
          parent_element_id?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          element_type?: Database["public"]["Enums"]["element_type"]
          geometry?: Json
          id?: string
          material_id?: string | null
          name?: string
          parameters?: Json
          parent_element_id?: string | null
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
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
            foreignKeyName: "bim_elements_upload_id_fkey"
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
        Relationships: []
      }
      detection_results: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          detected_objects: Json
          id: string
          model_used: string | null
          processing_time_ms: number | null
          upload_id: string
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          detected_objects: Json
          id?: string
          model_used?: string | null
          processing_time_ms?: number | null
          upload_id: string
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          detected_objects?: Json
          id?: string
          model_used?: string | null
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
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
