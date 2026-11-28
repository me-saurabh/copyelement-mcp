#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CopyElementClient } from './client.js';

const client = new CopyElementClient();

const server = new McpServer({
  name: 'copyelement-mcp',
  version: '1.0.1',
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
 * Structural analyzer to extract semantic outline from raw Elementor JSON trees.
 * Conserves 95%+ LLM tokens compared to dumping thousands of raw JSON lines.
 */
interface ElementSummary {
  totalContainers: number;
  totalWidgets: number;
  widgetTypes: string[];
  treeOutline: string[];
}

function summarizeElements(elements: any[]): ElementSummary {
  let totalContainers = 0;
  let totalWidgets = 0;
  const widgetSet = new Set<string>();
  const treeOutline: string[] = [];

  function traverse(items: any[], depth: number) {
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const indent = '  '.repeat(Math.min(depth, 5));
      const elType = item.elType || 'element';

      if (elType === 'container' || elType === 'section' || elType === 'column') {
        totalContainers++;
        const direction = item.settings?.flex_direction || item.settings?.container_type || elType;
        if (treeOutline.length < 25) {
          treeOutline.push(`${indent}📦 Container (${direction})`);
        }
      } else if (elType === 'widget') {
        totalWidgets++;
        const widgetType = item.widgetType || 'widget';
        widgetSet.add(widgetType);
        const titleSnippet = item.settings?.title || item.settings?.heading_title || item.settings?.text;
        const preview = titleSnippet ? ` "${String(titleSnippet).slice(0, 28)}..."` : '';
        if (treeOutline.length < 25) {
          treeOutline.push(`${indent}🔹 [${widgetType}]${preview}`);
        }
      }

      if (item.elements && Array.isArray(item.elements)) {
        traverse(item.elements, depth + 1);
      }
    }
  }

  if (Array.isArray(elements)) {
    traverse(elements, 0);
  }

  return {
    totalContainers,
    totalWidgets,
    widgetTypes: Array.from(widgetSet),
    treeOutline,
  };
}

/**
 * Tool: Search Components
 */
server.tool(
  'search_components',
  'Search CopyElement components (heroes, bento grids, footers, pricing, etc.) with compact or detailed formatting.',
  {
    query: z.string().optional().describe('Search keyword (e.g., "bento", "hero split", "pricing", "dark saas", "footer")'),
    category: z.string().optional().describe('Filter by component category slug (e.g., "bento", "hero", "wireframes", "pricing-table")'),
    filter: z.enum(['all', 'free', 'pro']).optional().default('all').describe('Filter by pricing tier: "all", "free", or "pro"'),
    only_v4: z.boolean().optional().default(false).describe('Filter exclusively for Elementor V4 container components'),
    limit: z.number().min(1).max(100).optional().default(20).describe('Max results to return (default: 20)'),
    compact: z.boolean().optional().default(true).describe('Compact output (default: true) saves 60%+ LLM context tokens'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env variable is set)'),
  },
  async ({ query, category, filter, only_v4, limit, compact, apiKey }) => {
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

      let formatted = '';
      if (compact) {
        // High-density token-optimized format
        formatted = response.items.map((item, index) => {
          const tier = item.is_pro ? '[PRO]' : '[FREE]';
          const v4 = item.is_v4 ? ' [V4]' : '';
          return `${index + 1}. ${tier}${v4} **${item.name}** | ID: \`${item.id}\` | Category: \`${item.category || 'general'}\``;
        }).join('\n');
      } else {
        formatted = response.items.map((item, index) => {
          const cat = item.category || 'Uncategorized';
          const tier = item.is_pro ? '[PRO]' : '[FREE]';
          const v4 = item.is_v4 ? ' [V4]' : ' [V3]';
          return `${index + 1}. ${tier}${v4} **${item.name}**\n   - ID: \`${item.id}\`\n   - Category: ${cat}\n   - Preview: ${item.preview_image || item.image_url || 'none'}\n   - Description: ${item.description || 'No description'}\n   - Plan Access: ${item.accessible ? 'Accessible' : 'Pro Required'}`;
        }).join('\n\n');
      }

      return {
        content: [{
          type: 'text',
          text: `Found ${response.items.length} components (Tier: ${response.user_tier.toUpperCase()} | Quota remaining: ${response.remaining_quota ?? 'N/A'}):\n\n${formatted}\n\nTip: To retrieve Elementor JSON with minimal token usage, call get_elementor_payload with save_to_file: "./filename.json" or summary_only: true.`,
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
  'Search full-page Elementor website templates and kits (Insura, Zenpay, Eradica, SaaS, Corporate, etc.) with token-optimized results.',
  {
    query: z.string().optional().describe('Search keyword (e.g., "insurance", "fintech", "pest control", "agency", "landing page")'),
    category: z.string().optional().describe('Filter by template category slug (e.g., "business-corporate", "technology", "creative-design")'),
    filter: z.enum(['all', 'free', 'pro']).optional().default('all').describe('Filter by pricing tier: "all", "free", or "pro"'),
    limit: z.number().min(1).max(100).optional().default(20).describe('Max results to return (default: 20)'),
    compact: z.boolean().optional().default(true).describe('Compact output (default: true) saves 60%+ LLM context tokens'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env variable is set)'),
  },
  async ({ query, category, filter, limit, compact, apiKey }) => {
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

      let formatted = '';
      if (compact) {
        formatted = response.items.map((item, index) => {
          const tier = item.is_pro ? '[PRO]' : '[FREE]';
          return `${index + 1}. ${tier} **${item.name}** | ID: \`${item.id}\` | Category: \`${item.category || 'template'}\``;
        }).join('\n');
      } else {
        formatted = response.items.map((item, index) => {
          const cat = item.category || 'Uncategorized';
          const tier = item.is_pro ? '[PRO]' : '[FREE]';
          return `${index + 1}. ${tier} **${item.name}**\n   - ID: \`${item.id}\`\n   - Category: ${cat}\n   - Preview: ${item.preview_image || item.image_url || 'none'}\n   - Description: ${item.description || 'Full page Elementor layout'}`;
        }).join('\n\n');
      }

      return {
        content: [{
          type: 'text',
          text: `Found ${response.items.length} full-page templates (Tier: ${response.user_tier.toUpperCase()} | Quota remaining: ${response.remaining_quota ?? 'N/A'}):\n\n${formatted}\n\nTip: Call get_elementor_payload with save_to_file: "./template.json" to write the template directly to disk without burning chat tokens.`,
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
 * Tool: Get Native Elementor Payload (Token-Optimized with direct file saving & structural summary)
 */
server.tool(
  'get_elementor_payload',
  'Retrieve the Elementor JSON container/section tree. Supports save_to_file and summary_only to consume 95%+ less LLM tokens.',
  {
    id: z.string().describe('The UUID of the component or template'),
    type: z.enum(['component', 'template']).optional().default('component').describe('Item type: "component" or "template"'),
    save_to_file: z.string().optional().describe('Optional local file path (e.g. "./my-template.json") to write the full JSON directly to disk. Recommended: saves 95%+ context tokens.'),
    summary_only: z.boolean().optional().default(false).describe('If true, returns only the structural hierarchy & widget outline without dumping raw JSON into chat context.'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ id, type, save_to_file, summary_only, apiKey }) => {
    try {
      const result = await client.fetchPayload(id, type, apiKey);
      const elements = result.elements || [];
      const summary = summarizeElements(elements);

      // If user specified save_to_file, write directly to disk and return ultra-light summary
      if (save_to_file) {
        const filePath = path.isAbsolute(save_to_file)
          ? save_to_file
          : path.resolve(process.cwd(), save_to_file);

        // Ensure parent directory exists
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        const filePayload = {
          version: '0.4',
          title: result.name || `${type}-${id}`,
          type: type === 'template' ? 'page' : 'container',
          content: elements,
        };

        const jsonStr = JSON.stringify(filePayload, null, 2);
        await fs.writeFile(filePath, jsonStr, 'utf8');
        const sizeKb = (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'saved_to_file',
              name: result.name,
              type: result.type,
              saved_path: filePath,
              file_size: `${sizeKb} KB`,
              containers_count: summary.totalContainers,
              widgets_count: summary.totalWidgets,
              widget_types_included: summary.widgetTypes,
              layout_preview: summary.treeOutline,
              instructions: `Successfully saved ${sizeKb} KB Elementor JSON to ${path.basename(filePath)}. You can import it into WordPress via Elementor > Templates > Import Templates.`,
            }, null, 2),
          }],
        };
      }

      // If user requested summary only (ultra-lightweight token consumption)
      if (summary_only) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'structural_summary',
              id: result.id,
              name: result.name,
              type: result.type,
              is_v4: result.is_v4,
              is_pro: result.is_pro,
              total_root_containers: elements.length,
              total_containers: summary.totalContainers,
              total_widgets: summary.totalWidgets,
              widget_types: summary.widgetTypes,
              structure_outline: summary.treeOutline,
              tip: 'Pass save_to_file: "./output.json" to write this template directly to disk, or call again without summary_only to see full JSON.',
            }, null, 2),
          }],
        };
      }

      // Standard response: includes summary + elements, with note if payload is heavy
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
            summary: {
              containers: summary.totalContainers,
              widgets: summary.totalWidgets,
              widget_types: summary.widgetTypes,
            },
            elements_count: elements.length,
            elements: elements,
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
  'Assemble multiple components and sections into a single complete Elementor Page Template JSON file. Supports save_to_file for token efficiency.',
  {
    title: z.string().describe('Template title (e.g., "Modern Fintech Landing Page")'),
    component_ids: z.array(z.string()).min(1).describe('Ordered list of component UUIDs (e.g., [hero_id, bento_id, pricing_id, footer_id])'),
    save_to_file: z.string().optional().describe('Optional local file path (e.g. "./page.json") to write assembled page directly to disk, conserving 95%+ tokens.'),
    apiKey: z.string().optional().describe('CopyElement API key (optional if COPYELEMENT_API_KEY env is set)'),
  },
  async ({ title, component_ids, save_to_file, apiKey }) => {
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

      const summary = summarizeElements(allElements);

      // If save_to_file is requested, write to disk and omit raw JSON from LLM conversation tokens
      if (save_to_file) {
        const filePath = path.isAbsolute(save_to_file)
          ? save_to_file
          : path.resolve(process.cwd(), save_to_file);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        const jsonStr = JSON.stringify(elementorTemplate, null, 2);
        await fs.writeFile(filePath, jsonStr, 'utf8');
        const sizeKb = (Buffer.byteLength(jsonStr, 'utf8') / 1024).toFixed(1);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'saved_to_file',
              title,
              saved_path: filePath,
              file_size: `${sizeKb} KB`,
              components_included: includedComponents,
              total_root_containers: allElements.length,
              total_widgets: summary.totalWidgets,
              widget_types: summary.widgetTypes,
              layout_preview: summary.treeOutline,
              instructions: `Assembled page template saved to ${path.basename(filePath)}. Import it into WordPress via Elementor > Templates > Import Templates.`,
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            title,
            components_included: includedComponents,
            total_root_containers: allElements.length,
            total_widgets: summary.totalWidgets,
            template_json: elementorTemplate,
            instructions: 'Save template_json to a .json file (e.g. page-template.json) or pass save_to_file: "./page.json" to save directly.',
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
  'Quickly list available component and template design categories and layout slugs for fast searches.',
  {},
  async () => {
    const compList = COMPONENT_CATEGORIES.map(c => `• **${c.name}** (\`${c.slug}\`): ${c.description}`).join('\n');
    const tplList = TEMPLATE_CATEGORIES.map(c => `• **${c.name}** (\`${c.slug}\`): ${c.description}`).join('\n');

    return {
      content: [{
        type: 'text',
        text: `Available Component Categories:\n${compList}\n\nAvailable Template Categories:\n${tplList}\n\nUsage: Pass category: "<slug>" to search_components or search_templates for instant targeted results.`,
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
