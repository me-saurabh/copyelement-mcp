export interface Category {
  id?: string;
  name: string;
  slug: string;
}

export interface ComponentItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_pro: boolean;
  is_v4: boolean;
  tags: string;
  slug: string;
  likes?: number;
  category?: Category | null;
}

export interface ComponentsApiResponse {
  components: ComponentItem[];
  total: number;
}

export interface InsertApiResponse {
  success: boolean;
  name?: string;
  is_v4?: boolean;
  elements?: any[];
  remaining_quota?: number;
  error?: string;
  needs_upgrade?: boolean;
}

export interface SearchOptions {
  query?: string;
  category?: string;
  filter?: 'all' | 'free' | 'pro';
  limit?: number;
}
