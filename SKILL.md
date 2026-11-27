---
name: copyelement
description: Search, inspect, and insert 5,000+ Elementor components, V4 containers, and 2,000+ full-page templates directly into Elementor pages using the official copyelement-mcp server.
---

# CopyElement MCP Skill

This skill provides step-by-step instructions for AI agents (Cursor, Claude Desktop, Antigravity, Windsurf) to discover, fetch, and assemble production-grade Elementor V3/V4 components and full-page website templates using `copyelement-mcp`.

---

## 🔑 Requirements & Authentication

1. **CopyElement API Key**:
   - Obtain an API key from [copyelement.com/profile](https://copyelement.com/profile).
   - Set the environment variable:
     ```bash
     export COPYELEMENT_API_KEY="ce_live_..."
     ```
   - Alternatively, pass the `apiKey` argument to individual tool calls.

2. **Access Tiers**:
   - **Free Users**: Can access and insert all free components and templates (`is_pro: false`).
   - **Pro Users**: Can access all 5,000+ components, 2,000+ templates, and next-gen Elementor V4 elements.

---

## 🧰 Available Tools & Usage

### 1. `search_components`
Search and filter components (heroes, headers, footers, bento grids, pricing tables, etc.) that have importable Elementor files.

**Arguments:**
- `query` *(string, optional)*: Search keyword (e.g., `"bento"`, `"hero split"`, `"pricing"`, `"dark saas"`).
- `category` *(string, optional)*: Category slug (e.g., `"hero"`, `"bento"`, `"pricing-table"`, `"footer"`, `"wireframes"`).
- `filter` *(string, optional)*: `"all"`, `"free"`, or `"pro"` (default: `"all"`).
- `only_v4` *(boolean, optional)*: Filter exclusively for Elementor V4 container components.
- `limit` *(number, optional)*: Max results to return (default: `20`, max: `100`).

---

### 2. `search_templates`
Search full-page website templates and kits (Insura, Zenpay, Eradica, SaaS, Corporate, etc.) that have importable Elementor files.

**Arguments:**
- `query` *(string, optional)*: Search keyword (e.g., `"insurance"`, `"fintech"`, `"agency"`, `"landing page"`).
- `category` *(string, optional)*: Template category slug (e.g., `"business-corporate"`, `"technology"`, `"creative-design"`).
- `filter` *(string, optional)*: `"all"`, `"free"`, or `"pro"`.
- `limit` *(number, optional)*: Max results to return (default: `20`).

---

### 3. `get_component` & `get_template`
Retrieve full metadata, preview image URLs, and tags for a specific component or template.

**Arguments:**
- `id` *(string, required)*: The UUID or slug of the component/template.

---

### 4. `get_elementor_payload`
Retrieve the production-ready Elementor JSON element tree. Direct storage/CDN URLs are hidden; the API securely delivers the normalized element container structure.

**Arguments:**
- `id` *(string, required)*: UUID of the component or template.
- `type` *(string, optional)*: `"component"` (default) or `"template"`.

**Response:**
Returns `{ success: true, elements: [...] }` containing the root Elementor container/section array ready for clipboard pasting or canvas insertion.

---

### 5. `build_elementor_page`
Merge multiple section components into a unified, standard Elementor Page Template JSON with regenerated collision-free IDs.

**Arguments:**
- `title` *(string, required)*: Template title (e.g., `"Modern SaaS Landing Page"`).
- `component_ids` *(array of strings, required)*: Ordered list of component UUIDs to stitch together:
  `["hero_uuid", "bento_uuid", "pricing_uuid", "footer_uuid"]`.

**Output:**
Returns a complete Elementor Page JSON (`{ version: "0.4", type: "page", title: "...", content: [...] }`) ready to save to a `.json` file and import into WordPress.

---

## 💡 Best Practices

1. **Check Pricing Tier**: If generating designs for free users, pass `filter: "free"` to avoid returning Pro items they cannot insert.
2. **Elementor V4 Compatibility**: For modern Elementor 4 container setups, use `only_v4: true` when searching components to ensure clean flexbox/grid container markup.
3. **Assemble Pages Fast**: Use `search_components` to identify sections, then pass the UUIDs directly into `build_elementor_page` to generate a complete, ready-to-import website layout in a single prompt.
