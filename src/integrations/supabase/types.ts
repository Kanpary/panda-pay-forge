export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      access_logs: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          ip: string | null;
          path: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          ip?: string | null;
          path?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          ip?: string | null;
          path?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      affiliate_commissions: {
        Row: {
          affiliate_id: string;
          amount: number;
          created_at: string;
          deposit_id: string | null;
          id: string;
          referred_user_id: string | null;
          released_at: string | null;
          status: Database["public"]["Enums"]["commission_status"];
          tipo: string;
          updated_at: string;
        };
        Insert: {
          affiliate_id: string;
          amount: number;
          created_at?: string;
          deposit_id?: string | null;
          id?: string;
          referred_user_id?: string | null;
          released_at?: string | null;
          status?: Database["public"]["Enums"]["commission_status"];
          tipo?: string;
          updated_at?: string;
        };
        Update: {
          affiliate_id?: string;
          amount?: number;
          created_at?: string;
          deposit_id?: string | null;
          id?: string;
          referred_user_id?: string | null;
          released_at?: string | null;
          status?: Database["public"]["Enums"]["commission_status"];
          tipo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_deposit_id_fkey";
            columns: ["deposit_id"];
            isOneToOne: false;
            referencedRelation: "deposits";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          is_public: boolean;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          is_public?: boolean;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      deposits: {
        Row: {
          amount: number;
          bonus: number;
          created_at: string;
          external_id: string | null;
          gateway: string;
          id: string;
          metadata: Json;
          paid_at: string | null;
          qrcode: string | null;
          qrcode_image: string | null;
          status: Database["public"]["Enums"]["deposit_status"];
          txid: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          bonus?: number;
          created_at?: string;
          external_id?: string | null;
          gateway?: string;
          id?: string;
          metadata?: Json;
          paid_at?: string | null;
          qrcode?: string | null;
          qrcode_image?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          txid?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          bonus?: number;
          created_at?: string;
          external_id?: string | null;
          gateway?: string;
          id?: string;
          metadata?: Json;
          paid_at?: string | null;
          qrcode?: string | null;
          qrcode_image?: string | null;
          status?: Database["public"]["Enums"]["deposit_status"];
          txid?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      game_history: {
        Row: {
          aposta: number;
          created_at: string;
          data: Json;
          ganho: number;
          id: string;
          is_demo: boolean;
          resultado: string | null;
          session_id: string | null;
          user_id: string;
        };
        Insert: {
          aposta?: number;
          created_at?: string;
          data?: Json;
          ganho?: number;
          id?: string;
          is_demo?: boolean;
          resultado?: string | null;
          session_id?: string | null;
          user_id: string;
        };
        Update: {
          aposta?: number;
          created_at?: string;
          data?: Json;
          ganho?: number;
          id?: string;
          is_demo?: boolean;
          resultado?: string | null;
          session_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_history_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      game_sessions: {
        Row: {
          aposta: number;
          created_at: string;
          data: Json;
          ended_at: string | null;
          ganho: number;
          id: string;
          is_demo: boolean;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          aposta?: number;
          created_at?: string;
          data?: Json;
          ended_at?: string | null;
          ganho?: number;
          id?: string;
          is_demo?: boolean;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          aposta?: number;
          created_at?: string;
          data?: Json;
          ended_at?: string | null;
          ganho?: number;
          id?: string;
          is_demo?: boolean;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      game_settings: {
        Row: {
          created_at: string;
          id: string;
          slug: string;
          updated_at: string;
          user_id: string | null;
          value: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          slug: string;
          updated_at?: string;
          user_id?: string | null;
          value?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          slug?: string;
          updated_at?: string;
          user_id?: string | null;
          value?: number;
        };
        Relationships: [];
      };
      gateway_webhooks: {
        Row: {
          created_at: string;
          error: string | null;
          event: string | null;
          external_id: string | null;
          id: string;
          payload: Json;
          processed: boolean;
          provider: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          event?: string | null;
          external_id?: string | null;
          id?: string;
          payload?: Json;
          processed?: boolean;
          provider?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          event?: string | null;
          external_id?: string | null;
          id?: string;
          payload?: Json;
          processed?: boolean;
          provider?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          affiliate_code: string | null;
          bloqueado: boolean;
          comissao_cpa: number;
          comissao_cpa_nivel2: number;
          comissao_revshare: number;
          cpf: string | null;
          created_at: string;
          email: string | null;
          estado: string | null;
          id: string;
          is_demo: boolean;
          nome: string | null;
          pix_key: string | null;
          pix_type: string | null;
          referred_by: string | null;
          saldo: number;
          saldo_bonus: number;
          saldo_comissao: number;
          telefone: string | null;
          tipo_conta: string;
          total_apostado: number;
          total_depositado: number;
          updated_at: string;
        };
        Insert: {
          affiliate_code?: string | null;
          bloqueado?: boolean;
          comissao_cpa?: number;
          comissao_cpa_nivel2?: number;
          comissao_revshare?: number;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          estado?: string | null;
          id: string;
          is_demo?: boolean;
          nome?: string | null;
          pix_key?: string | null;
          pix_type?: string | null;
          referred_by?: string | null;
          saldo?: number;
          saldo_bonus?: number;
          saldo_comissao?: number;
          telefone?: string | null;
          tipo_conta?: string;
          total_apostado?: number;
          total_depositado?: number;
          updated_at?: string;
        };
        Update: {
          affiliate_code?: string | null;
          bloqueado?: boolean;
          comissao_cpa?: number;
          comissao_cpa_nivel2?: number;
          comissao_revshare?: number;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          estado?: string | null;
          id?: string;
          is_demo?: boolean;
          nome?: string | null;
          pix_key?: string | null;
          pix_type?: string | null;
          referred_by?: string | null;
          saldo?: number;
          saldo_bonus?: number;
          saldo_comissao?: number;
          telefone?: string | null;
          tipo_conta?: string;
          total_apostado?: number;
          total_depositado?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      withdrawals: {
        Row: {
          amount: number;
          cpf: string | null;
          created_at: string;
          external_id: string | null;
          id: string;
          metadata: Json;
          motivo_rejeicao: string | null;
          nome: string | null;
          pix_key: string;
          pix_type: string;
          processed_at: string | null;
          status: Database["public"]["Enums"]["withdrawal_status"];
          taxa: number;
          tipo: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          cpf?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json;
          motivo_rejeicao?: string | null;
          nome?: string | null;
          pix_key: string;
          pix_type: string;
          processed_at?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          taxa?: number;
          tipo?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          cpf?: string | null;
          created_at?: string;
          external_id?: string | null;
          id?: string;
          metadata?: Json;
          motivo_rejeicao?: string | null;
          nome?: string | null;
          pix_key?: string;
          pix_type?: string;
          processed_at?: string | null;
          status?: Database["public"]["Enums"]["withdrawal_status"];
          taxa?: number;
          tipo?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_overview: { Args: never; Returns: Json };
      game_place_bet: {
        Args: { _aposta: number; _is_demo?: boolean };
        Returns: {
          saldo: number;
          saldo_bonus: number;
          session_id: string;
        }[];
      };
      game_settle_bet: {
        Args: {
          _data?: Json;
          _ganho: number;
          _resultado?: string;
          _session_id: string;
        };
        Returns: {
          ganho: number;
          saldo: number;
          saldo_bonus: number;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "agente" | "afiliado" | "user";
      commission_status: "pending" | "approved" | "paid" | "rejected";
      deposit_status: "pending" | "paid" | "expired" | "cancelled";
      withdrawal_status: "pending" | "approved" | "paid" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agente", "afiliado", "user"],
      commission_status: ["pending", "approved", "paid", "rejected"],
      deposit_status: ["pending", "paid", "expired", "cancelled"],
      withdrawal_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const;
