#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CopyElementClient } from './client.js';

const client = new CopyElementClient();

const server = new McpServer({
  name: 'copyelement-mcp',
  version: '1.0.0',
});

// Category list constant for quick reference and validation
const KNOWN_CATEGORIES = [
  { slug: 'wireframes', name: 'WireFrames (V4)', description: '520+ wireframe structural layout components' },
  { slug: 'hero', name: 'Hero Sections', description: 'Split, centered, minimal, and high-impact hero sections' },
  { slug: 'bento', name: 'Bento Grids', description: 'Modern Apple/Stripe-style interactive bento grid layouts' },
  { slug: 'feature-and-benefits', name: 'Feature and Benefits', description: 'Product and service feature grids and showcases' },
  { slug: 'testimonials', name: 'Testimonials', description: 'Social proof, reviews, carousels, and spotlight quotes' },
  { slug: 'pricing-table', name: 'Pricing Tables', description: 'Comparison charts, monthly/annual toggle pricing' },
  { slug: 'call-to-action', name: 'Call to Action (CTA)', description: 'Lead capture, email opt-ins, and conversion banners' },
  { slug: 'team', name: 'Team & Bio', description: 'Team member cards, founder profiles, and avatar grids' },
  { slug: 'faq', name: 'FAQ Sections', description: 'Accordion questions and answers' },
  { slug: 'footer', name: 'Footers', description: 'Modern responsive multi-column website footers' },
  { slug: 'header', name: 'Headers & Menus', description: 'Site navigation and header layouts' },
  { slug: 'timeline', name: 'Timeline & Process', description: 'Step-by-step roadmap and company milestones' },
  { slug: 'counter', name: 'Counters & Stats', description: 'Animated metrics and key performance indicators' },
];

/**
 * Tool: Search V4 Components
 */
server.tool(
  'search_v4_components',
  'Search and discover CopyElement Elementor V4 components, bento grids, hero sections, and wireframes.',
  {
    query: z.string().optional().describe('Search keyword (e.g., "bento", "hero split", "dark saas", "pricing", "pricing toggle")'),
    category: z.string().optional().describe('Filter by category slug (e.g., "bento", "hero", "wireframes", "testimonials", "pricing-table", "footer")'),
    filter: z.enum(['all', 'free', 'pro']).optional().default('all').describe('Filter by pricing tier: "all", "free", or "pro"'),
    limit: z.number().min(1).max(100).optional().default(15).describe('Maximum number of items to return (default: 15)'),
  },
  async ({ query, category, filter, limit }) => {
    try {
      const items = await client.fetchCatalog('component', { query, category, filter, limit });

      if (items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No V4 components found matching query: "${query || ''}" in category: "${category || 'all'}". Try broader keywords or call get_v4_categories to see available categories.`,
          }],
        };
      }

      const formatted = items.map((item, index) => {
        const cat = item.category?.name || 'Uncategorized';
        const tier = item.is_pro ? '[PRO]' : '[FREE]';
        return `${index + 1}. ${tier} **${item.name}**\n   - ID: \`${item.id}\`\n   - Category: ${cat}\n   - Tags: ${item.tags || 'none'}\n   - Preview Image: ${item.image_url}\n   - Description: ${item.description || 'No description'}\n   - Web URL: https://copyelement.com/components/${item.slug || item.id}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${items.length} V4 components:\n\n${formatted}\n\nTip: Call get_v4_elementor_payload with a component ID to retrieve its native Elementor V4 container JSON.`,
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to search components: ${err.message}` }],
      };
    }
  }
);

/**
 * Tool: Get Available V4 Categories
 */
server.tool(
  'get_v4_categories',
  'List all available Elementor V4 design categories and layouts.',
  {},
  async () => {
    const list = KNOWN_CATEGORIES.map(c => `* **${c.name}** (slug: \`${c.slug}\`): ${c.description}`).join('\n');
    return {
      content: [{
        type: 'text',
        text: `Available CopyElement V4 Categories:\n\n${list}\n\nUse the category slug with search_v4_components (e.g. category: "bento") to explore specific styles.`,
      }],
    };
  }
);

/**
 * Tool: Get Single Component Details
 */
server.tool(
  'get_v4_component',
  'Get comprehensive details, preview image, and metadata for a specific V4 component.',
  {
    id: z.string().describe('The UUID or slug of the component'),
  },
  async ({ id }) => {
    try {
      const item = await client.getComponentById(id);
      if (!item) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Component with ID "${id}" was not found in the CopyElement V4 library.` }],
        };
      }

      const info = {
        id: item.id,
        name: item.name,
        category: item.category?.name || 'Uncategorized',
        category_slug: item.category?.slug,
        is_pro: item.is_pro,
        is_v4: item.is_v4,
        description: item.description,
        tags: item.tags,
        preview_image_url: item.image_url,
        url: `https://copyelement.com/components/${item.slug || item.id}`,
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(info, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${err.message}` }],
      };
    }
  }
);

/**
 * Tool: Get Native Elementor V4 Payload
 */
server.tool(
  'get_v4_elementor_payload',
  'Retrieve the production-ready Elementor V4 JSON element container tree for live page insertion.',
  {
    id: z.string().describe('The UUID of the component'),
    type: z.enum(['component', 'template']).optional().default('component').describe('Item type: "component" or "template"'),
    apiKey: z.string().optional().describe('CopyElement Bearer API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ id, type, apiKey }) => {
    try {
      const result = await client.fetchPayload(id, type, apiKey);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            component_id: id,
            name: result.name,
            is_v4: result.is_v4,
            elements_count: result.elements?.length || 0,
            elements: result.elements,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to fetch Elementor payload: ${err.message}\nNote: Pro items require setting COPYELEMENT_API_KEY environment variable.`,
        }],
      };
    }
  }
);

/**
 * Tool: Build Complete Elementor V4 Page Template
 */
server.tool(
  'build_v4_page_template',
  'Assemble multiple V4 components into a single complete Elementor Page Template JSON file ready for 1-click import into WordPress.',
  {
    title: z.string().describe('Template title (e.g. "Modern AI SaaS Landing Page")'),
    component_ids: z.array(z.string()).min(1).describe('Ordered list of component UUIDs to stitch together (e.g., [hero_id, bento_id, pricing_id, footer_id])'),
    apiKey: z.string().optional().describe('CopyElement Bearer API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ title, component_ids, apiKey }) => {
    try {
      const allElements: any[] = [];
      const includedComponents: string[] = [];

      for (const id of component_ids) {
        const payload = await client.fetchPayload(id, 'component', apiKey);
        if (payload.elements && Array.isArray(payload.elements)) {
          // Regenerate IDs recursively to prevent collision between merged sections
          const clonedElements = regenerateElementIds(payload.elements);
          allElements.push(...clonedElements);
          includedComponents.push(`${payload.name || id} (${id})`);
        }
      }

      // Elementor template standard export structure
      const elementorTemplate = {
        version: '0.4',
        title: title || 'CopyElement V4 Assembled Template',
        type: 'page',
        content: allElements,
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            title,
            components_included: includedComponents,
            total_root_containers: allElements.length,
            template_json: elementorTemplate,
            instructions: 'Save template_json to a .json file (e.g. template.json) and import it via WordPress Admin > Elementor > Templates > Import Templates.',
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to build page template: ${err.message}` }],
      };
    }
  }
);

/**
 * Helper: Regenerate Elementor element IDs to prevent DOM collision
 */
function regenerateElementIds(elements: any[]): any[] {
  return elements.map(el => {
    const copy = { ...el };
    if (copy.id) {
      copy.id = Math.random().toString(36).substring(2, 9);
    }
    if (copy.elements && Array.isArray(copy.elements)) {
      copy.elements = regenerateElementIds(copy.elements);
    }
    return copy;
  });
}

/**
 * Start the MCP Server using Standard Input/Output Transport
 */
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CopyElement V4 MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in CopyElement MCP server:', error);
  process.exit(1);
});
