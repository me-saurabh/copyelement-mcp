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

// Category quick reference constants
const COMPONENT_CATEGORIES = [
  { slug: 'hero', name: 'Hero Header Sections', description: 'Impactful centered, split, and minimal hero sections' },
  { slug: 'bento', name: 'Bento Grids', description: 'Apple/Stripe-style interactive multi-box feature grids' },
  { slug: 'feature-and-benefits', name: 'Feature Sections', description: 'Product and service feature showcases' },
  { slug: 'testimonials', name: 'Testimonials & Reviews', description: 'Social proof, review grids, and quotes' },
  { slug: 'pricing-table', name: 'Pricing Tables', description: 'Tiered subscription and pricing tables' },
  { slug: 'call-to-action', name: 'Call to Action (CTA)', description: 'Lead capture and conversion banners' },
  { slug: 'wireframes', name: 'WireFrames (V4)', description: '520+ structural wireframe layout elements' },
  { slug: 'footer', name: 'Footers', description: 'Responsive multi-column footers' },
  { slug: 'header', name: 'Headers & Navbars', description: 'Navigation bars and mega menu structures' },
  { slug: 'faq', name: 'FAQ Sections', description: 'Accordion questions and answers' },
  { slug: 'team', name: 'Team & Bios', description: 'Team member cards and profile grids' },
];

const TEMPLATE_CATEGORIES = [
  { slug: 'business-corporate', name: 'Business & Corporate', description: 'Full business, agency, and insurance kits (e.g., Insura, Eradica)' },
  { slug: 'technology', name: 'Technology & SaaS', description: 'Fintech, SaaS, and software templates (e.g., Zenpay)' },
  { slug: 'creative-design', name: 'Creative & Design', description: 'Design agency, studio, and portfolio kits' },
  { slug: 'health-medical', name: 'Health & Medical', description: 'Clinics, dental, wellness, and medical templates' },
  { slug: 'food-drink', name: 'Food & Drink', description: 'Restaurants, cafes, catering, and bakery kits' },
  { slug: 'beauty', name: 'Beauty & Salon', description: 'Spas, beauty salons, and cosmetics layouts' },
];

/**
 * Tool: Search Components
 */
server.tool(
  'search_components',
  'Search and discover CopyElement Elementor components (heroes, bento grids, footers, pricing, etc.) that have importable Elementor files.',
  {
    query: z.string().optional().describe('Search keyword (e.g., "bento", "hero split", "pricing", "dark saas", "footer")'),
    category: z.string().optional().describe('Filter by component category slug (e.g., "bento", "hero", "wireframes", "pricing-table")'),
    filter: z.enum(['all', 'free', 'pro']).optional().default('all').describe('Filter by pricing tier: "all", "free", or "pro"'),
    only_v4: z.boolean().optional().default(false).describe('Filter exclusively for Elementor V4 container components'),
    limit: z.number().min(1).max(100).optional().default(20).describe('Max results to return (default: 20)'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env variable is set)'),
  },
  async ({ query, category, filter, only_v4, limit, apiKey }) => {
    try {
      const response = await client.fetchCatalog('component', {
        query,
        category,
        filter,
        v4: only_v4,
        limit,
        apiKey,
      });

      if (!response.items || response.items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No components found matching query: "${query || ''}" in category: "${category || 'all'}". Try broader search keywords.`,
          }],
        };
      }

      const formatted = response.items.map((item, index) => {
        const cat = item.category || 'Uncategorized';
        const tier = item.is_pro ? '[PRO]' : '[FREE]';
        const v4 = item.is_v4 ? ' [V4]' : ' [V3]';
        return `${index + 1}. ${tier}${v4} **${item.name}**\n   - ID: \`${item.id}\`\n   - Category: ${cat}\n   - Tags: ${item.tags || 'none'}\n   - Preview: ${item.preview_image || item.image_url || 'none'}\n   - Description: ${item.description || 'No description'}\n   - Accessible on your plan: ${item.accessible ? 'Yes' : 'No (Pro required)'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${response.items.length} components (User Tier: ${response.user_tier.toUpperCase()} | Remaining Quota: ${response.remaining_quota ?? 'N/A'}):\n\n${formatted}\n\nTip: Call get_elementor_payload with a component ID to retrieve its Elementor JSON container tree.`,
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
 * Tool: Search Templates
 */
server.tool(
  'search_templates',
  'Search and discover CopyElement full-page Elementor website templates and kits (Insura, Zenpay, Eradica, SaaS, Corporate, etc.) that have importable Elementor files.',
  {
    query: z.string().optional().describe('Search keyword (e.g., "insurance", "fintech", "pest control", "agency", "landing page")'),
    category: z.string().optional().describe('Filter by template category slug (e.g., "business-corporate", "technology", "creative-design")'),
    filter: z.enum(['all', 'free', 'pro']).optional().default('all').describe('Filter by pricing tier: "all", "free", or "pro"'),
    limit: z.number().min(1).max(100).optional().default(20).describe('Max results to return (default: 20)'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env variable is set)'),
  },
  async ({ query, category, filter, limit, apiKey }) => {
    try {
      const response = await client.fetchCatalog('template', {
        query,
        category,
        filter,
        limit,
        apiKey,
      });

      if (!response.items || response.items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No templates found matching query: "${query || ''}" in category: "${category || 'all'}". Try broader search keywords.`,
          }],
        };
      }

      const formatted = response.items.map((item, index) => {
        const cat = item.category || 'Uncategorized';
        const tier = item.is_pro ? '[PRO]' : '[FREE]';
        return `${index + 1}. ${tier} **${item.name}**\n   - ID: \`${item.id}\`\n   - Category: ${cat}\n   - Preview: ${item.preview_image || item.image_url || 'none'}\n   - Description: ${item.description || 'Full page Elementor layout'}\n   - Accessible on your plan: ${item.accessible ? 'Yes' : 'No (Pro required)'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${response.items.length} full-page templates (User Tier: ${response.user_tier.toUpperCase()} | Remaining Quota: ${response.remaining_quota ?? 'N/A'}):\n\n${formatted}\n\nTip: Call get_elementor_payload with a template ID and type "template" to retrieve its Elementor JSON structure.`,
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Failed to search templates: ${err.message}` }],
      };
    }
  }
);

/**
 * Tool: Get Component Details
 */
server.tool(
  'get_component',
  'Get comprehensive metadata, tags, preview images, and category for a specific component.',
  {
    id: z.string().describe('The UUID or slug of the component'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ id, apiKey }) => {
    try {
      const item = await client.getItemDetails(id, 'component', apiKey);
      if (!item) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Component "${id}" was not found or has no importable file.` }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(item, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error retrieving component: ${err.message}` }],
      };
    }
  }
);

/**
 * Tool: Get Template Details
 */
server.tool(
  'get_template',
  'Get comprehensive metadata and preview images for a specific full-page template kit.',
  {
    id: z.string().describe('The UUID or slug of the template'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ id, apiKey }) => {
    try {
      const item = await client.getItemDetails(id, 'template', apiKey);
      if (!item) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Template "${id}" was not found or has no importable file.` }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(item, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error retrieving template: ${err.message}` }],
      };
    }
  }
);

/**
 * Tool: Get Native Elementor Payload
 */
server.tool(
  'get_elementor_payload',
  'Retrieve the production-ready Elementor JSON container/section tree for live page insertion. Direct CDN URLs are completely hidden behind the secure API gateway.',
  {
    id: z.string().describe('The UUID of the component or template'),
    type: z.enum(['component', 'template']).optional().default('component').describe('Item type: "component" or "template"'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ id, type, apiKey }) => {
    try {
      const result = await client.fetchPayload(id, type, apiKey);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            id: result.id,
            name: result.name,
            type: result.type,
            is_v4: result.is_v4,
            is_pro: result.is_pro,
            elements_count: result.elements?.length || 0,
            elements: result.elements,
            remaining_quota: result.remaining_quota,
          }, null, 2),
        }],
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Failed to fetch Elementor payload: ${err.message}`,
        }],
      };
    }
  }
);

/**
 * Tool: Build Complete Elementor Page Template
 */
server.tool(
  'build_elementor_page',
  'Assemble multiple components and sections into a single complete Elementor Page Template JSON file ready for 1-click import into WordPress.',
  {
    title: z.string().describe('Template title (e.g., "Modern Fintech Landing Page")'),
    component_ids: z.array(z.string()).min(1).describe('Ordered list of component UUIDs (e.g., [hero_id, bento_id, pricing_id, footer_id])'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
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
        title: title || 'CopyElement Assembled Page Template',
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
            instructions: 'Save template_json to a .json file (e.g. page-template.json) and import it via WordPress Admin > Elementor > Templates > Import Templates, or copy content into Elementor canvas.',
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
 * Tool: List Categories
 */
server.tool(
  'list_categories',
  'List available component and template design categories and layout slugs.',
  {},
  async () => {
    const compList = COMPONENT_CATEGORIES.map(c => `* **${c.name}** (slug: \`${c.slug}\`): ${c.description}`).join('\n');
    const tplList = TEMPLATE_CATEGORIES.map(c => `* **${c.name}** (slug: \`${c.slug}\`): ${c.description}`).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Available Component Categories:\n${compList}\n\nAvailable Template Categories:\n${tplList}\n\nUse category slugs with search_components or search_templates.`,
      }],
    };
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
  console.error('CopyElement MCP Server running on stdio');
}

run().catch((error) => {
  console.error('Fatal error in CopyElement MCP server:', error);
  process.exit(1);
});
