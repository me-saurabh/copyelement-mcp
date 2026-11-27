import type {
  ComponentsApiResponse,
  ComponentItem,
  InsertApiResponse,
  SearchOptions,
} from './types.js';

export class CopyElementClient {
  private apiBase: string;
  private defaultApiKey?: string;

  constructor(apiBase?: string, defaultApiKey?: string) {
    this.apiBase = (
      apiBase ||
      process.env.COPYELEMENT_API_URL ||
      'https://copyelement.com'
    ).replace(/\/+$/, '');
    this.defaultApiKey = defaultApiKey || process.env.COPYELEMENT_API_KEY;
  }

  /**
   * Fetch catalog of components or templates from CopyElement middle API.
   * Direct CDN URLs are completely hidden.
   */
  async fetchCatalog(
    type: 'component' | 'template' = 'component',
    options: SearchOptions = {}
  ): Promise<ComponentsApiResponse> {
    const params = new URLSearchParams({
      type,
      category: options.category || 'all',
      filter: options.filter || 'all',
      search: options.query || '',
      limit: String(options.limit || 50),
    });

    if (options.v4) {
      params.set('v4', '1');
    }

    const token = options.apiKey || this.defaultApiKey;
    if (!token) {
      throw new Error(
        'Authentication required: Please provide a CopyElement API key via the COPYELEMENT_API_KEY environment variable or apiKey parameter. Generate your key at https://copyelement.com/profile.'
      );
    }

    const url = `${this.apiBase}/api/mcp/components?${params.toString()}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'CopyElement-MCP/1.0.0',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, { headers });
    const data = (await response.json()) as ComponentsApiResponse;

    if (!response.ok) {
      const msg = data.error || `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 401) {
        throw new Error(
          `Unauthorized: ${msg} Please verify your COPYELEMENT_API_KEY from https://copyelement.com/profile.`
        );
      }
      if (response.status === 429) {
        throw new Error(
          `Rate limit exceeded: ${msg}`
        );
      }
      throw new Error(`Catalog query failed: ${msg}`);
    }

    return data;
  }

  /**
   * Fetch single component or template details by ID or slug.
   */
  async getItemDetails(
    idOrSlug: string,
    type: 'component' | 'template' = 'component',
    apiKey?: string
  ): Promise<ComponentItem | null> {
    const catalog = await this.fetchCatalog(type, { limit: 150, apiKey });
    const target = (idOrSlug || '').toLowerCase();
    const found = catalog.items.find(
      (item) =>
        (item.id && item.id.toLowerCase() === target) ||
        (item.slug && item.slug.toLowerCase() === target)
    );
    return found || null;
  }

  /**
   * Retrieve the Elementor JSON element container tree for page insertion.
   * Direct CDN URLs are completely hidden. The middle API returns normalized elements.
   */
  async fetchPayload(
    id: string,
    type: 'component' | 'template' = 'component',
    apiKey?: string
  ): Promise<InsertApiResponse> {
    const token = apiKey || this.defaultApiKey;

    if (!token) {
      throw new Error(
        'Authentication required: Please set the COPYELEMENT_API_KEY environment variable (or pass apiKey argument) to retrieve and insert CopyElement templates and components. Generate your key at https://copyelement.com/profile.'
      );
    }

    const url = `${this.apiBase}/api/mcp/payload`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'CopyElement-MCP/1.0.0',
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, type }),
    });

    const data = (await response.json()) as InsertApiResponse;

    if (!response.ok) {
      const message = data.error || `HTTP error ${response.status}`;
      if (response.status === 401) {
        throw new Error(
          `Authentication failed: ${message} (Check COPYELEMENT_API_KEY)`
        );
      }
      if (response.status === 403) {
        throw new Error(
          `Pro Access Required: ${message} (Upgrade at https://copyelement.com/pricing)`
        );
      }
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${message}`);
      }
      throw new Error(`Payload retrieval error: ${message}`);
    }

    return data;
  }
}
