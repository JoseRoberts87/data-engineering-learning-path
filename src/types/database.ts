export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      capstone_steps: {
        Row: {
          created_at: string
          description: string
          hints: string | null
          id: string
          phase_id: string | null
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          hints?: string | null
          id?: string
          phase_id?: string | null
          slug: string
          sort_order: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          hints?: string | null
          id?: string
          phase_id?: string | null
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "capstone_steps_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_questions: {
        Row: {
          checkpoint_id: string
          created_at: string
          explanation: string | null
          id: string
          options: Json
          prompt: string
          sort_order: number
        }
        Insert: {
          checkpoint_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          options: Json
          prompt: string
          sort_order: number
        }
        Update: {
          checkpoint_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          prompt?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_questions_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoints: {
        Row: {
          created_at: string
          description: string | null
          id: string
          pass_score: number
          phase_id: string
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          pass_score?: number
          phase_id: string
          slug: string
          sort_order: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          pass_score?: number
          phase_id?: string
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      concept_sections: {
        Row: {
          concept_id: string
          created_at: string
          id: string
          payload: Json
          sort_order: number
          type: Database["public"]["Enums"]["concept_section_type"]
        }
        Insert: {
          concept_id: string
          created_at?: string
          id?: string
          payload: Json
          sort_order: number
          type: Database["public"]["Enums"]["concept_section_type"]
        }
        Update: {
          concept_id?: string
          created_at?: string
          id?: string
          payload?: Json
          sort_order?: number
          type?: Database["public"]["Enums"]["concept_section_type"]
        }
        Relationships: [
          {
            foreignKeyName: "concept_sections_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          created_at: string
          description: string
          id: string
          phase_id: string
          slug: string
          sort_order: number
          swe_analogy: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          phase_id: string
          slug: string
          sort_order: number
          swe_analogy: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          phase_id?: string
          slug?: string
          sort_order?: number
          swe_analogy?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "concepts_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string
          id: string
          number: number
          slug: string
          sort_order: number
          tagline: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          slug: string
          sort_order: number
          tagline?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          slug?: string
          sort_order?: number
          tagline?: string | null
          title?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempted_at: string
          checkpoint_id: string
          id: string
          passed: boolean
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          attempted_at?: string
          checkpoint_id: string
          id?: string
          passed: boolean
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          attempted_at?: string
          checkpoint_id?: string
          id?: string
          passed?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_checkpoint_id_fkey"
            columns: ["checkpoint_id"]
            isOneToOne: false
            referencedRelation: "checkpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          concept_id: string | null
          created_at: string
          id: string
          phase_id: string | null
          resource_type: string
          title: string
          url: string
        }
        Insert: {
          concept_id?: string | null
          created_at?: string
          id?: string
          phase_id?: string | null
          resource_type?: string
          title: string
          url: string
        }
        Update: {
          concept_id?: string | null
          created_at?: string
          id?: string
          phase_id?: string | null
          resource_type?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_messages: {
        Row: {
          concept_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          concept_id?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          concept_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_messages_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_capstone_progress: {
        Row: {
          completed_at: string | null
          id: string
          notes: string
          status: Database["public"]["Enums"]["progress_status"]
          step_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string
          status?: Database["public"]["Enums"]["progress_status"]
          step_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string
          status?: Database["public"]["Enums"]["progress_status"]
          step_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_capstone_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "capstone_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          body: string
          concept_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          concept_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          concept_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          concept_id: string
          id: string
          status: Database["public"]["Enums"]["progress_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          concept_id: string
          id?: string
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          concept_id?: string
          id?: string
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_concept_id_fkey"
            columns: ["concept_id"]
            isOneToOne: false
            referencedRelation: "concepts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      concept_section_type:
        | "failure_catalog"
        | "comparison"
        | "dimensions"
        | "inline_quiz"
      progress_status: "not_started" | "in_progress" | "completed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      concept_section_type: [
        "failure_catalog",
        "comparison",
        "dimensions",
        "inline_quiz",
      ],
      progress_status: ["not_started", "in_progress", "completed"],
    },
  },
} as const

