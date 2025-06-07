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
      addon_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_multiple: boolean | null
          is_order_bump: boolean | null
          is_required: boolean | null
          max_select: number | null
          min_select: number | null
          name: string
          order_bump_description: string | null
          order_bump_image_url: string | null
          product_id: string | null
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_multiple?: boolean | null
          is_order_bump?: boolean | null
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name: string
          order_bump_description?: string | null
          order_bump_image_url?: string | null
          product_id?: string | null
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_multiple?: boolean | null
          is_order_bump?: boolean | null
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name?: string
          order_bump_description?: string | null
          order_bump_image_url?: string | null
          product_id?: string | null
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addon_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      addon_items: {
        Row: {
          addon_category_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          addon_category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          addon_category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "addon_items_addon_category_id_fkey"
            columns: ["addon_category_id"]
            isOneToOne: false
            referencedRelation: "addon_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      mensage_user: {
        Row: {
          created_at: string
          id: number
          user_name: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          user_name?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          user_name?: string | null
          user_phone?: string | null
        }
        Relationships: []
      }
      order_bumps: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number
          store_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price: number
          store_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number
          store_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_bumps_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_addons: {
        Row: {
          addon_item_id: string | null
          created_at: string
          id: string
          order_item_id: string | null
          price: number
        }
        Insert: {
          addon_item_id?: string | null
          created_at?: string
          id?: string
          order_item_id?: string | null
          price: number
        }
        Update: {
          addon_item_id?: string | null
          created_at?: string
          id?: string
          order_item_id?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_addons_addon_item_id_fkey"
            columns: ["addon_item_id"]
            isOneToOne: false
            referencedRelation: "addon_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_addons_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          price: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          price: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          complement: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number | null
          delivery_type: string | null
          id: string
          mercado_pago_payment_id: string | null
          neighborhood: string | null
          notes: string | null
          number: string | null
          payment_method: string
          reference_point: string | null
          scheduled_for: string | null
          state: string | null
          status: string | null
          store_id: string
          street: string | null
          subtotal: number
          total: number
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_fee?: number | null
          delivery_type?: string | null
          id?: string
          mercado_pago_payment_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          payment_method: string
          reference_point?: string | null
          scheduled_for?: string | null
          state?: string | null
          status?: string | null
          store_id: string
          street?: string | null
          subtotal: number
          total: number
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number | null
          delivery_type?: string | null
          id?: string
          mercado_pago_payment_id?: string | null
          neighborhood?: string | null
          notes?: string | null
          number?: string | null
          payment_method?: string
          reference_point?: string | null
          scheduled_for?: string | null
          state?: string | null
          status?: string | null
          store_id?: string
          street?: string | null
          subtotal?: number
          total?: number
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_agendados: {
        Row: {
          cliente_nome: string | null
          cliente_telefone: string | null
          data_agendada: string
          data_criacao: string | null
          enviado: boolean | null
          id: string
          texto_pedido: string
        }
        Insert: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          data_agendada: string
          data_criacao?: string | null
          enviado?: boolean | null
          id?: string
          texto_pedido: string
        }
        Update: {
          cliente_nome?: string | null
          cliente_telefone?: string | null
          data_agendada?: string
          data_criacao?: string | null
          enviado?: boolean | null
          id?: string
          texto_pedido?: string
        }
        Relationships: []
      }
      product_addon_categories: {
        Row: {
          addon_category_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          addon_category_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          addon_category_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_addon_categories_addon_category_id_fkey"
            columns: ["addon_category_id"]
            isOneToOne: false
            referencedRelation: "addon_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_addon_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[] | null
          allow_same_day_scheduling: boolean | null
          category_id: string
          created_at: string | null
          current_stock: number | null
          daily_stock: number | null
          description: string | null
          excess_unit_price: number | null
          has_addons: boolean | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          max_included_quantity: number | null
          name: string
          nutritional_info: Json | null
          preparation_time: number | null
          price: number
          sale_price: number | null
          stock_last_reset: string | null
          store_id: string
        }
        Insert: {
          allergens?: string[] | null
          allow_same_day_scheduling?: boolean | null
          category_id: string
          created_at?: string | null
          current_stock?: number | null
          daily_stock?: number | null
          description?: string | null
          excess_unit_price?: number | null
          has_addons?: boolean | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          max_included_quantity?: number | null
          name: string
          nutritional_info?: Json | null
          preparation_time?: number | null
          price: number
          sale_price?: number | null
          stock_last_reset?: string | null
          store_id: string
        }
        Update: {
          allergens?: string[] | null
          allow_same_day_scheduling?: boolean | null
          category_id?: string
          created_at?: string | null
          current_stock?: number | null
          daily_stock?: number | null
          description?: string | null
          excess_unit_price?: number | null
          has_addons?: boolean | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          max_included_quantity?: number | null
          name?: string
          nutritional_info?: Json | null
          preparation_time?: number | null
          price?: number
          sale_price?: number | null
          stock_last_reset?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          accent_color: string | null
          accept_cash: boolean | null
          accept_credit_card: boolean | null
          accept_pix: boolean | null
          address: string | null
          allow_scheduling: boolean | null
          allows_pickup: boolean | null
          city: string | null
          closing_time: string | null
          cover_image_url: string | null
          cover_url: string | null
          created_at: string | null
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_schedule: Json | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          mercado_pago_access_token: string | null
          mercado_pago_public_key: string | null
          minimum_order: number | null
          name: string
          opening_time: string | null
          order_limit_time: string | null
          owner_id: string
          pickup_address: string | null
          pickup_available: boolean | null
          pickup_instructions: string | null
          pickup_schedule: Json | null
          primary_color: string | null
          same_day_cutoff_time: string | null
          scheduling_deadline: string | null
          secondary_color: string | null
          slug: string
          special_dates: Json | null
          state: string | null
          weekly_schedule: Json | null
          whatsapp: string
          zip: string | null
        }
        Insert: {
          accent_color?: string | null
          accept_cash?: boolean | null
          accept_credit_card?: boolean | null
          accept_pix?: boolean | null
          address?: string | null
          allow_scheduling?: boolean | null
          allows_pickup?: boolean | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_schedule?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          minimum_order?: number | null
          name: string
          opening_time?: string | null
          order_limit_time?: string | null
          owner_id: string
          pickup_address?: string | null
          pickup_available?: boolean | null
          pickup_instructions?: string | null
          pickup_schedule?: Json | null
          primary_color?: string | null
          same_day_cutoff_time?: string | null
          scheduling_deadline?: string | null
          secondary_color?: string | null
          slug: string
          special_dates?: Json | null
          state?: string | null
          weekly_schedule?: Json | null
          whatsapp: string
          zip?: string | null
        }
        Update: {
          accent_color?: string | null
          accept_cash?: boolean | null
          accept_credit_card?: boolean | null
          accept_pix?: boolean | null
          address?: string | null
          allow_scheduling?: boolean | null
          allows_pickup?: boolean | null
          city?: string | null
          closing_time?: string | null
          cover_image_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_schedule?: Json | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          mercado_pago_access_token?: string | null
          mercado_pago_public_key?: string | null
          minimum_order?: number | null
          name?: string
          opening_time?: string | null
          order_limit_time?: string | null
          owner_id?: string
          pickup_address?: string | null
          pickup_available?: boolean | null
          pickup_instructions?: string | null
          pickup_schedule?: Json | null
          primary_color?: string | null
          same_day_cutoff_time?: string | null
          scheduling_deadline?: string | null
          secondary_color?: string | null
          slug?: string
          special_dates?: Json | null
          state?: string | null
          weekly_schedule?: Json | null
          whatsapp?: string
          zip?: string | null
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      enviar_pedidos_agendados: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_product_count_by_category: {
        Args: { p_store_id: string }
        Returns: {
          category_id: string
          count: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_store_owner: {
        Args: { store_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
