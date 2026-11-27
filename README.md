# copyelement-mcp

> **The Official Model Context Protocol (MCP) Server for CopyElement.**  
> Give AI agents in **Claude Desktop, Cursor, Antigravity, Windsurf, and ChatGPT** direct powers to discover, inspect, and insert 5,000+ Elementor components, V4 containers, and 2,000+ full-page templates.

[![npm version](https://img.shields.io/npm/v/copyelement-mcp.svg)](https://www.npmjs.com/package/copyelement-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Elementor V4 Ready](https://img.shields.io/badge/Elementor-V4%20Atomic%20Containers-8b5cf6.svg)](https://copyelement.com)

---

## ⚡ What is CopyElement MCP?

**CopyElement** is the largest curated library of copy-paste Elementor components, V4 container elements, and full-page website templates.

With **`copyelement-mcp`**, your AI coding assistants can:
1. **Search & Browse Components:** Query 5,000+ components across 15+ categories (Hero, Bento Grids, Wireframes, Pricing, Testimonials, Footers).
2. **Search Full-Page Templates:** Query 2,000+ full website template kits (Business, SaaS, Agency, Insurance, Fintech, Healthcare).
3. **Get Production Code:** Fetch the native Elementor JSON container trees directly without manual file copying.
4. **Assemble Complete Page Templates:** Stitch multiple sections (e.g., Hero + Bento + Pricing + Footer) into a single 1-click importable `.json` page template file!
5. **Secure & Rate-Limited:** Direct CDN URLs are 100% hidden behind CopyElement's secure API gateway, with rate limiting protection for all users.

---

## 🔑 Authentication & API Key

To access the server, you need a personal CopyElement API Key (`ce_live_...`):

1. Log into your account at [copyelement.com](https://copyelement.com).
2. Go to your **[Profile > API & MCP](https://copyelement.com/profile)** tab.
3. Click **Generate API Key** and copy your key.

* **Free Users:** Can generate an API key and access all 100% free components and full-page templates.
* **Pro Users:** Can access the entire library of 5,000+ components, V4 elements, and 2,000+ templates.

---

## 🚀 Quick Start (Zero Install via `npx`)

Run directly with `npx`:

```bash
COPYELEMENT_API_KEY="ce_live_your_key_here" npx copyelement-mcp
```

---

## 🛠️ Configuration for AI Clients

### 1. Cursor IDE

Add this to your `~/.cursor/mcp.json` or project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "copyelement": {
      "command": "npx",
      "args": ["-y", "copyelement-mcp"],
      "env": {
        "COPYELEMENT_API_KEY": "ce_live_your_key_here"
      }
    }
  }
}
```

### 2. Claude Desktop

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
        "COPYELEMENT_API_KEY": "ce_live_your_key_here"
      }
    }
  }
}
```

### 3. Windsurf

Add this to your `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "copyelement": {
      "command": "npx",
      "args": ["-y", "copyelement-mcp"],
      "env": {
        "COPYELEMENT_API_KEY": "ce_live_your_key_here"
      }
    }
  }
}
```

---

## 🧰 Available MCP Tools

| Tool | Description |
| :--- | :--- |
| `search_components` | Search & filter components with query, category, pricing (`all`, `free`, `pro`), and V4 toggle. |
| `search_templates` | Search full-page website kits and layouts (Insura, Zenpay, Eradica, SaaS, Corporate, etc.). |
| `get_component` | Retrieve metadata, preview images, and tags for a specific component. |
| `get_template` | Retrieve metadata and preview images for a specific full-page template kit. |
| `get_elementor_payload` | Fetch the production-ready Elementor JSON element tree ready to insert into an Elementor page. |
| `build_elementor_page` | Merge multiple sections into a single standard Elementor page template `.json` file with unique IDs. |
| `list_categories` | Quick discovery list of component and template design categories. |

---

## 📦 Publishing & Development

To build locally:

```bash
git clone https://github.com/me-saurabh/copyelement-mcp.git
cd copyelement-mcp
npm install
npm run build
```

To run tests:

```bash
npm start
```

---

## 📄 License

MIT License &copy; [CopyElement](https://copyelement.com).
