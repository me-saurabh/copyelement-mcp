# copyelement-mcp

> **The Official Model Context Protocol (MCP) Server for CopyElement V4.**  
> Give AI agents in **Claude Desktop, Cursor, Antigravity, Windsurf, and ChatGPT** direct superpowers to discover, inspect, and assemble 560+ production-grade Elementor V4 components, bento grids, and templates.

[![npm version](https://img.shields.io/npm/v/copyelement-mcp.svg)](https://www.npmjs.com/package/copyelement-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Elementor V4 Ready](https://img.shields.io/badge/Elementor-V4%20Atomic%20Containers-8b5cf6.svg)](https://copyelement.com)

---

## ⚡ What is CopyElement MCP?

Elementor V4 introduced atomic flexbox/grid containers, CSS variables, and global classes. **CopyElement** is the largest curated library of production-ready Elementor V4 components.

With **`copyelement-mcp`**, your AI coding assistants (Claude, Cursor, etc.) can:
1. **Search & Browse:** Query 560+ V4 components across 15+ categories (Hero, Bento Grids, Wireframes, Pricing, Testimonials, Footers).
2. **Inspect & Preview:** View live preview image URLs, responsive structure, and design tokens before inserting.
3. **Get Production Code:** Fetch the native Elementor V4 JSON element trees with zero manual copying.
4. **Assemble Complete Templates:** Automatically stitch multiple sections (e.g. Hero + Bento + Pricing + Footer) into a single 1-click importable `.json` page template file!

---

## 🚀 Quick Start (Zero Install via `npx`)

Run directly with `npx`:

```bash
npx copyelement-mcp
```

---

## 🛠️ Configuration for AI Clients

### 1. Claude Desktop

Add this to your `claude_desktop_config.json`:

* **MacOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copyelement": {
      "command": "npx",
      "args": ["-y", "copyelement-mcp"],
      "env": {
        "COPYELEMENT_API_KEY": "YOUR_COPYELEMENT_TOKEN_HERE"
      }
    }
  }
}
```

> **Note:** `COPYELEMENT_API_KEY` is optional for browsing free components and wireframes, and required to insert Pro V4 items. You can generate a token in your [CopyElement Account](https://copyelement.com).

---

### 2. Cursor IDE

In your project root, create or edit `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "copyelement": {
      "command": "npx",
      "args": ["-y", "copyelement-mcp"],
      "env": {
        "COPYELEMENT_API_KEY": "YOUR_COPYELEMENT_TOKEN_HERE"
      }
    }
  }
}
```

---

### 3. Antigravity

In Antigravity settings or `antigravity.json`:

```json
{
  "mcpServers": {
    "copyelement": {
      "command": "npx",
      "args": ["-y", "copyelement-mcp"],
      "env": {
        "COPYELEMENT_API_KEY": "YOUR_COPYELEMENT_TOKEN_HERE"
      }
    }
  }
}
```

---

## 🧰 Available MCP Tools

### `search_v4_components`
Search components across categories, tags, or keywords.
* **Arguments:**
  * `query` (optional): e.g. `"bento"`, `"split hero"`, `"dark pricing"`, `"testimonial"`
  * `category` (optional): e.g. `"hero"`, `"bento"`, `"wireframes"`, `"testimonials"`, `"pricing-table"`, `"footer"`
  * `filter` (optional): `"all"` | `"free"` | `"pro"` (default: `"all"`)
  * `limit` (optional): max items to return (default: `15`, max: `100`)

### `get_v4_categories`
Returns all available layout categories and descriptions.

### `get_v4_component`
Fetches detailed metadata, tags, and live preview image URL for a specific component UUID or slug.
* **Arguments:**
  * `id` (required): Component UUID or slug

### `get_v4_elementor_payload`
Streams the production-ready Elementor V4 JSON element container tree (`elements`) for insertion.
* **Arguments:**
  * `id` (required): Component UUID
  * `type` (optional): `"component"` (default) or `"template"`
  * `apiKey` (optional): Override Bearer token if not set in environment

### `build_v4_page_template`
Stitches multiple V4 components into a single valid Elementor page template `.json` file with deduplicated IDs.
* **Arguments:**
  * `title` (required): Title for the template (e.g. `"SaaS Landing Page"`)
  * `component_ids` (required): Ordered list of UUIDs, e.g. `["hero-id", "bento-id", "pricing-id", "footer-id"]`

---

## 💡 Example AI Prompts

Try asking Claude or Cursor:

> *"Search for dark bento grids in CopyElement V4 and show me the preview links."*

> *"Build a complete landing page using CopyElement V4 for a modern AI software company: pick a hero, a bento feature section, testimonials, pricing table, and a footer, and assemble them into a template JSON file."*

> *"Find a free V4 wireframe hero and get its Elementor JSON code."*

---

## 🔒 Security & Cloud Privacy

* **Zero R2 URL Exposure:** Storage URLs are kept 100% private. Payload retrieval is proxied server-to-server.
* **Encrypted API Communication:** All communication routes through secure TLS endpoints with Bearer token authentication.

---

## 📦 Development & Local Testing

Clone and test locally:

```bash
git clone https://github.com/me-saurabh/copyelement-mcp.git
cd copyelement-mcp
npm install
npm run build
npm start
```

### Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 📄 License

MIT License © [CopyElement](https://copyelement.com) & [Saurabh](https://github.com/me-saurabh).
