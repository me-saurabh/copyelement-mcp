export interface Category {
  id?: string;
  name: string;
  slug: string;
}

export interface ComponentItem {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  preview_image?: string;
  is_pro: boolean;
  is_v4?: boolean;
  tags?: string;
  slug?: string;
  category?: Category | string | null;
  category_slug?: string;
  accessible?: boolean;
  payload_endpoint?: string;
}

export interface ComponentsApiResponse {
  success: boolean;
  user_tier: 'free' | 'pro';
  remaining_quota?: number;
  count: number;
  items: ComponentItem[];
  error?: string;
}

export interface InsertApiResponse {
  success: boolean;
  id?: string;
  name?: string;
  type?: 'component' | 'template';
  is_v4?: boolean;
  is_pro?: boolean;
  elements?: any[];
  remaining_quota?: number;
  error?: string;
  needs_upgrade?: boolean;
  upgrade_url?: string;
}

export interface SearchOptions {
  query?: string;
  category?: string;
  filter?: 'all' | 'free' | 'pro';
  v4?: boolean;
  limit?: number;
  apiKey?: string;
}
