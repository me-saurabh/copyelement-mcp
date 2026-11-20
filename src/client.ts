import type { ComponentsApiResponse, ComponentItem, InsertApiResponse, SearchOptions } from './types.js';

export class CopyElementClient {
  private apiBase: string;
  private defaultApiKey?: string;

  constructor(apiBase?: string, defaultApiKey?: string) {
    this.apiBase = (apiBase || process.env.COPYELEMENT_API_URL || 'https://copyelement.com').replace(/\/+$/, '');
    this.defaultApiKey = defaultApiKey || process.env.COPYELEMENT_API_KEY;
  }

  /**
   * Fetch components and templates from CopyElement catalog
   */
  async fetchCatalog(type: 'component' | 'template' = 'component', options: SearchOptions = {}): Promise<ComponentItem[]> {
    const params = new URLSearchParams({
      type,
      v4: '1',
      category: options.category || 'all',
      filter: options.filter || 'all',
      search: options.query || '',
    });

    const url = `${this.apiBase}/api/v4/plugin/components?${params.toString()}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'CopyElement-MCP/1.0.0',
    };

    if (this.defaultApiKey) {
      headers['Authorization'] = `Bearer ${this.defaultApiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to fetch catalog from CopyElement (${response.status}): ${errorText || response.statusText}`);
    }

    const data = (await response.json()) as ComponentsApiResponse;
    let items = data.components || [];

    if (options.limit && options.limit > 0) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  /**
   * Fetch single component details
   */
  async getComponentById(id: string): Promise<ComponentItem | null> {
    const all = await this.fetchCatalog('component', { limit: 1000 });
    const found = all.find(c => c.id.toLowerCase() === id.toLowerCase() || c.slug === id);
    if (found) return found;

    // Check templates as well
    const templates = await this.fetchCatalog('template', { limit: 100 });
    return templates.find(t => t.id.toLowerCase() === id.toLowerCase() || t.slug === id) || null;
  }

  /**
   * Retrieve the Elementor V4 JSON container payload
   */
  async fetchPayload(id: string, type: 'component' | 'template' = 'component', apiKey?: string): Promise<InsertApiResponse> {
    const url = `${this.apiBase}/api/v4/plugin/insert`;
    const token = apiKey || this.defaultApiKey;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'CopyElement-MCP/1.0.0',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, type }),
    });

    const data = (await response.json()) as InsertApiResponse;

    if (!response.ok) {
      const message = data.error || `HTTP error ${response.status}`;
      if (response.status === 401 || response.status === 403) {
        throw new Error(`${message} (Ensure COPYELEMENT_API_KEY is configured with a valid Pro account)`);
      }
      throw new Error(`Payload error: ${message}`);
    }

    return data;
  }
}
