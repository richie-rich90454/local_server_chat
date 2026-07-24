# AGENTS.md

## What this is

Vanilla JS local-network chat app. Express + `ws` WebSocket server, Vite-built frontend. No TypeScript, no tests, no lint, no CI.

## Commands

| Task | Command |
|------|---------|
| Dev server (Vite, port 5173) | `npm run dev` |
| Build for production | `npm run build` |
| Run production | `node server.js` |
| Build standalone executable | `npm run package` |

No lint, typecheck, or test commands exist. `npm test` is a stub that exits 1.

## Ports

- **2047** — Express static UI (production)
- **8191** — WebSocket server
- **9876** — UDP multicast LAN discovery
- Dev mode uses Vite's port **5173** instead of 2047

## Architecture

- `server.js` — single-file Node server (Express + WebSocket + UDP discovery). Serves `dist/` in production. Manages rooms, polls, stats.
- `src/script.js` — client entry point. Imports from sibling modules.
- `src/websocket.js` — thin WebSocket wrapper; connects to `ws://<hostname>:8191`.
- `src/games.js` — 2048, chess, and all slash commands (`/help`, `/poll`, `/stats`, `/diag`, etc.).
- `src/file-handler.js` — file transfer via binary WebSocket chunks (5 GB max, 16 MB chunks).
- `src/identicon.js` — deterministic geometric SVG identicons from usernames.
- `src/ui-helpers.js` — modal, export, theme, scroll utilities.
- `src/highlight-config.js` — syntax highlighting for ~50 languages + markdown formatting.
- `vite.config.js` — builds to `dist/`, uses `vite-plugin-html`, Lightning CSS, rolldown code splitting.

## Runtime Arguments

```
node server.js                          # Private server (default)
node server.js --name "Physics Class"   # Discoverable server with name
```

Providing `--name` enables LAN discovery via UDP multicast. Join code generated automatically.

## Key Features

- **Rooms**: Ephemeral, created on demand, deleted when empty. Default: General, Homework, Programming, Gaming, Robotics.
- **Polls**: `/poll "Question" "Option1" "Option2"` — anonymous, one vote per connection, RAM only.
- **Stats**: `/stats` — live messages/min, users, files transferred, uptime.
- **Diagnostics**: `/diag` — HTTP reachability, WebSocket status, latency.
- **Identicons**: Deterministic geometric SVG avatars next to every message.
- **Join codes**: 4-char alphanumeric, displayed on login with QR code.
- **LAN discovery**: UDP multicast broadcasts server presence every 2s.

## Gotchas

- `dist/` is gitignored. Production requires `npm run build` before `node server.js`.
- ESM throughout (`"type": "module"` in package.json, `import` syntax everywhere).
- WebSocket runs on `host: "::"` (IPv6 dual-stack). Client connects to whatever `window.location.hostname` is.
- No auth. Anyone on the LAN can join. Messages are plain text.
- Rate limit: 3 msg/sec, 5s ban on exceed.
- Binary messages (images, voice, files) bypass rate limiting.
- Rooms are server-scoped: messages only reach users in the same room.
- All runtime state (rooms, polls, stats, join codes) is RAM-only, lost on server exit.

## Code Style

Dense, no blank lines, 4-space indent, `let` for variables, semicolons always, opening braces on same line as keyword.
