# 🔴 RED Browser

A neon-themed web proxy browser powered by **Scramjet** and **DuckDuckGo**.

```
██████╗ ███████╗██████╗ 
██╔══██╗██╔════╝██╔══██╗
██████╔╝█████╗  ██║  ██║
██╔══██╗██╔══╝  ██║  ██║
██║  ██║███████╗██████╔╝
╚═╝  ╚═╝╚══════╝╚═════╝ 
```

## Features

- **Scramjet Proxy** — Service worker-based traffic routing via bare-server-node
- **DuckDuckGo Search** — Privacy-first default search engine (Google/Bing/Brave also available)
- **Multi-tab browsing** — Full tab management with Ctrl+T / Ctrl+W shortcuts
- **Settings panel** — Toggle proxy, adblock, JavaScript, animations, accent color
- **Panic Key** — Double-tap Escape to instantly hide the browser
- **Tab title cloaking** — Disguise the tab as another page
- **Bookmarks** — Save and manage bookmarks locally
- **Neon theme** — Red/black cyberpunk UI with scanlines, glow effects, and flicker animations
- **Status bar** — Live clock, proxy status, and page status

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Copy Scramjet assets

```bash
node setup.js
```

This copies the Scramjet codec and worker files from `node_modules` to `public/static/`.

### 3. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 4. Open RED

Visit **http://localhost:8080** in your browser.


### How the proxy works

1. User enters a URL or search term
2. RED resolves it to a full URL and prefixes it with `/~/`
3. The Scramjet service worker intercepts `/~/` requests
4. It encodes the request and forwards it to the **Bare server** at `/bare/`
5. The Bare server makes the actual outbound HTTP/WebSocket request
6. The response is decoded and returned to the page

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+L` | Focus URL bar |
| `Esc × 2` | Panic hide (double-tap Escape) |
| `Enter` (in URL bar) | Navigate |

## Settings

| Setting | Description |
|---------|-------------|
| Scramjet Proxy | Enable/disable the proxy |
| Proxy Engine | Scramjet or Ultraviolet |
| Bare Server URL | Custom bare server endpoint |
| Search Engine | DuckDuckGo, Google, Bing, or Brave |
| Ad & Tracker Block | DNS-level ad blocking |
| JavaScript | Allow JS on proxied pages |
| Panic Key | Keyboard shortcut to hide browser |
| Tab Title Cloaking | Show a fake tab title |
| Animations | Toggle neon effects |
| Scanlines | Toggle CRT scanline overlay |
| Accent Color | Change the neon color |

## Requirements

- **Node.js** 18+
- **npm** 8+
- A modern browser with Service Worker support

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |****
