export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fisler: {
        Row: {
          id: string;
          fis_no: string | null;
          tarih_saat: string | null;
          created_at: string;
          updated_at: string;
          total: number | null;
          total_kdv: number | null;
          items: Json | null;
        };
        Insert: {
          id?: string;
          fis_no?: string | null;
          tarih_saat?: string | null;
          created_at?: string;
          updated_at?: string;
          total?: number | null;
          total_kdv?: number | null;
          items?: Json | null;
        };
        Update: {
          id?: string;
          fis_no?: string | null;
          tarih_saat?: string | null;
          created_at?: string;
          updated_at?: string;
          total?: number | null;
          total_kdv?: number | null;
          items?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
