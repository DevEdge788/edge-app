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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_confirmations: {
        Row: {
          appointment_id: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          responded_at: string | null
          response_source: string | null
          sent_at: string
          status: Database["public"]["Enums"]["confirmation_status"]
          token: string
        }
        Insert: {
          appointment_id: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          responded_at?: string | null
          response_source?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          token?: string
        }
        Update: {
          appointment_id?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          responded_at?: string | null
          response_source?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["confirmation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_confirmations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          channel: string | null
          checked_in_at: string | null
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          notes: string | null
          patient_id: string
          professional_id: string
          room_id: string | null
          specialty_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          channel?: string | null
          checked_in_at?: string | null
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          notes?: string | null
          patient_id: string
          professional_id: string
          room_id?: string | null
          specialty_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          channel?: string | null
          checked_in_at?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          notes?: string | null
          patient_id?: string
          professional_id?: string
          room_id?: string | null
          specialty_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          procedure_id: string | null
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          procedure_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          procedure_id?: string | null
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          discount: number
          id: string
          issued_at: string
          notes: string | null
          number: string
          patient_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          issued_at?: string
          notes?: string | null
          number?: string
          patient_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          id?: string
          issued_at?: string
          notes?: string | null
          number?: string
          patient_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          appointment_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          confirmation_id: string | null
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          patient_id: string | null
          provider: string
          recipient: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template: string
        }
        Insert: {
          appointment_id?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          confirmation_id?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          patient_id?: string | null
          provider?: string
          recipient?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template?: string
        }
        Update: {
          appointment_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          confirmation_id?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          patient_id?: string | null
          provider?: string
          recipient?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_confirmation_id_fkey"
            columns: ["confirmation_id"]
            isOneToOne: false
            referencedRelation: "appointment_confirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          clinical_notes: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_active: boolean
          phone: string | null
          postal_code: string | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          clinical_notes?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_active?: boolean
          phone?: string | null
          postal_code?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          clinical_notes?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_active?: boolean
          phone?: string | null
          postal_code?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          received_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          received_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          received_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      procedure_catalog: {
        Row: {
          base_price: number
          code: string
          commission_pct: number
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          specialty_id: string | null
        }
        Insert: {
          base_price?: number
          code: string
          commission_pct?: number
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          specialty_id?: string | null
        }
        Update: {
          base_price?: number
          code?: string
          commission_pct?: number
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          specialty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedure_catalog_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      procedures: {
        Row: {
          amount: number
          appointment_id: string
          catalog_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          status: Database["public"]["Enums"]["procedure_status"]
          tooth: string | null
        }
        Insert: {
          amount?: number
          appointment_id: string
          catalog_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["procedure_status"]
          tooth?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string
          catalog_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          status?: Database["public"]["Enums"]["procedure_status"]
          tooth?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procedures_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedures_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "procedure_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          agenda_color: string | null
          commission_pct: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          license_number: string | null
          phone: string | null
          specialty_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agenda_color?: string | null
          commission_pct?: number
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          phone?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agenda_color?: string | null
          commission_pct?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          phone?: string | null
          specialty_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          room_type: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          room_type?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          room_type?: string | null
        }
        Relationships: []
      }
      specialties: {
        Row: {
          color: string
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_own_patient: {
        Args: { _patient_id: string; _user_id: string }
        Returns: boolean
      }
      is_patient_of_professional: {
        Args: { _patient_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "rececionista" | "medico" | "paciente"
      appointment_status:
        | "agendada"
        | "confirmada"
        | "em_curso"
        | "concluida"
        | "cancelada"
        | "faltou"
      confirmation_status: "pendente" | "confirmada" | "recusada" | "reagendar"
      gender: "feminino" | "masculino" | "outro" | "nao_especificado"
      invoice_status: "rascunho" | "emitida" | "paga" | "anulada"
      notification_channel: "sms" | "whatsapp" | "email"
      notification_status: "simulado" | "enviado" | "falhado"
      payment_method:
        | "numerario"
        | "multibanco"
        | "mbway"
        | "cartao"
        | "transferencia"
        | "seguro"
        | "outro"
      procedure_status:
        | "planeado"
        | "em_curso"
        | "concluido"
        | "faturado"
        | "cancelado"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "rececionista", "medico", "paciente"],
      appointment_status: [
        "agendada",
        "confirmada",
        "em_curso",
        "concluida",
        "cancelada",
        "faltou",
      ],
      confirmation_status: ["pendente", "confirmada", "recusada", "reagendar"],
      gender: ["feminino", "masculino", "outro", "nao_especificado"],
      invoice_status: ["rascunho", "emitida", "paga", "anulada"],
      notification_channel: ["sms", "whatsapp", "email"],
      notification_status: ["simulado", "enviado", "falhado"],
      payment_method: [
        "numerario",
        "multibanco",
        "mbway",
        "cartao",
        "transferencia",
        "seguro",
        "outro",
      ],
      procedure_status: [
        "planeado",
        "em_curso",
        "concluido",
        "faturado",
        "cancelado",
      ],
    },
  },
} as const
