export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          created_at: string
          id: string
          lmstudio_endpoint: string
          lmstudio_model: string
          max_tokens: number
          openrouter_model: string
          provider: string
          system_prompt_override: string | null
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lmstudio_endpoint?: string
          lmstudio_model?: string
          max_tokens?: number
          openrouter_model?: string
          provider?: string
          system_prompt_override?: string | null
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lmstudio_endpoint?: string
          lmstudio_model?: string
          max_tokens?: number
          openrouter_model?: string
          provider?: string
          system_prompt_override?: string | null
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      canon_events: {
        Row: {
          character_id: string
          created_at: string
          description: string
          event_timestamp: string
          id: string
          involved_characters: string[]
          persona_id: string | null
          source_message_ids: string[]
          title: string
          user_id: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          description?: string
          event_timestamp?: string
          id?: string
          involved_characters?: string[]
          persona_id?: string | null
          source_message_ids?: string[]
          title: string
          user_id?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string
          event_timestamp?: string
          id?: string
          involved_characters?: string[]
          persona_id?: string | null
          source_message_ids?: string[]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canon_events_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_events_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          avatar_url: string | null
          backstory: string
          behavioral_boundaries: string
          created_at: string
          first_message: string
          id: string
          last_played_at: string | null
          name: string
          personality_traits: string[]
          speech_style: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          backstory?: string
          behavioral_boundaries?: string
          created_at?: string
          first_message?: string
          id?: string
          last_played_at?: string | null
          name: string
          personality_traits?: string[]
          speech_style?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          backstory?: string
          behavioral_boundaries?: string
          created_at?: string
          first_message?: string
          id?: string
          last_played_at?: string | null
          name?: string
          personality_traits?: string[]
          speech_style?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          character_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_canon: boolean
          persona_id: string | null
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          character_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_canon?: boolean
          persona_id?: string | null
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          character_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_canon?: boolean
          persona_id?: string | null
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          character_id: string
          created_at: string
          id: string
          persona_id: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          persona_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          persona_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          category: string
          character_id: string
          content: string
          created_at: string
          id: string
          importance: number
          persona_id: string | null
          source_message_id: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          character_id: string
          content: string
          created_at?: string
          id?: string
          importance?: number
          persona_id?: string | null
          source_message_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          character_id?: string
          content?: string
          created_at?: string
          id?: string
          importance?: number
          persona_id?: string | null
          source_message_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "user_personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_personas: {
        Row: {
          avatar_url: string | null
          backstory: string
          behavioral_boundaries: string
          created_at: string
          default_tone: string
          id: string
          last_used_at: string | null
          name: string
          personality_traits: string[]
          speech_style: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          backstory?: string
          behavioral_boundaries?: string
          created_at?: string
          default_tone?: string
          id?: string
          last_used_at?: string | null
          name: string
          personality_traits?: string[]
          speech_style?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          backstory?: string
          behavioral_boundaries?: string
          created_at?: string
          default_tone?: string
          id?: string
          last_used_at?: string | null
          name?: string
          personality_traits?: string[]
          speech_style?: string
          updated_at?: string
          user_id?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
