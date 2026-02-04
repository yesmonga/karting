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
      auth_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          type: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          type: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          type?: string
          used?: boolean
        }
        Relationships: []
      }
      drivers: {
        Row: {
          code: string
          color: string
          created_at: string
          full_name: string | null
          id: string
          name: string
          team_id: string
          weight_kg: number | null
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          full_name?: string | null
          id?: string
          name: string
          team_id: string
          weight_kg?: number | null
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          full_name?: string | null
          id?: string
          name?: string
          team_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          circuit_id: string
          config: Json
          created_at: string
          id: string
          race_start_time: number | null
          selected_kart: string
          selected_team: string
          stints: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          circuit_id: string
          config: Json
          created_at?: string
          id?: string
          race_start_time?: number | null
          selected_kart: string
          selected_team: string
          stints?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          circuit_id?: string
          config?: Json
          created_at?: string
          id?: string
          race_start_time?: number | null
          selected_kart?: string
          selected_team?: string
          stints?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboard_messages: {
        Row: {
          created_at: string
          id: string
          kart_number: string
          session_id: string | null
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          kart_number: string
          session_id?: string | null
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          kart_number?: string
          session_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboard_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_stops: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          lap_number: number
          race_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          lap_number: number
          race_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          lap_number?: number
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pit_stops_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      race_laps: {
        Row: {
          created_at: string
          id: string
          lap_number: number
          lap_time_ms: number
          race_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lap_number: number
          lap_time_ms: number
          race_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lap_number?: number
          lap_time_ms?: number
          race_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_laps_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          ballast_target_kg: number
          best_lap_ms: number | null
          best_lap_number: number | null
          created_at: string
          date: string | null
          id: string
          kart_number: number | null
          name: string
          position: number | null
          team_id: string
          total_karts: number | null
          total_laps: number | null
          track_name: string | null
        }
        Insert: {
          ballast_target_kg?: number
          best_lap_ms?: number | null
          best_lap_number?: number | null
          created_at?: string
          date?: string | null
          id?: string
          kart_number?: number | null
          name: string
          position?: number | null
          team_id: string
          total_karts?: number | null
          total_laps?: number | null
          track_name?: string | null
        }
        Update: {
          ballast_target_kg?: number
          best_lap_ms?: number | null
          best_lap_number?: number | null
          created_at?: string
          date?: string | null
          id?: string
          kart_number?: number | null
          name?: string
          position?: number | null
          team_id?: string
          total_karts?: number | null
          total_laps?: number | null
          track_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "races_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stints: {
        Row: {
          avg_lap_ms: number | null
          best_lap_ms: number | null
          created_at: string
          driver_id: string | null
          end_lap: number
          id: string
          race_id: string
          start_lap: number
          stint_number: number
          total_laps: number | null
        }
        Insert: {
          avg_lap_ms?: number | null
          best_lap_ms?: number | null
          created_at?: string
          driver_id?: string | null
          end_lap: number
          id?: string
          race_id: string
          start_lap: number
          stint_number: number
          total_laps?: number | null
        }
        Update: {
          avg_lap_ms?: number | null
          best_lap_ms?: number | null
          created_at?: string
          driver_id?: string | null
          end_lap?: number
          id?: string
          race_id?: string
          start_lap?: number
          stint_number?: number
          total_laps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stints_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stints_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_auth_codes: { Args: never; Returns: undefined }
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
