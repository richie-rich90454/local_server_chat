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

- `server.js` — entry point, wires server modules together.
- `src/server/args.js` — CLI flag parser (`--name`, `--no-http`).
- `src/server/discovery.js` — UDP multicast LAN broadcast.
- `src/server/http.js` — Express static files + REST endpoints.
- `src/server/websocket.js` — WebSocket server, rooms, polls, stats.
- `src/protocol/constants.js` — shared message types, ports, limits.
- `src/protocol/messages.js` — message builder functions.
- `src/client/connection.js` — browser WebSocket connection manager.
- `src/client/discovery.js` — HTTP-based server discovery.
- `src/client/renderer.js` — protocol message rendering.
- `src/script.js` — browser client entry point.
- `src/games.js` — 2048, chess, slash commands.
- `src/file-handler.js` — binary file transfer.
- `src/identicon.js` — deterministic SVG avatars.
- `src/ui-helpers.js` — modal, export, theme utilities.
- `src/highlight-config.js` — syntax highlighting + markdown.
- `client.js` — GUI client entry point (serves UI locally, listens for LAN servers, connects to remote server).
- `LocalServerChatClient.js` — native TUI client.
- `vite.config.js` — builds to `dist/`.
- `sea-config.json` — Node.js SEA config for standalone exe.
- `scripts/inject-sea.js` — blob injection into node executable.

## Runtime Arguments

```
node server.js                          # Private server (default)
node server.js --name "Physics Class"   # Discoverable server with name
node server.js --no-http                # Headless (WebSocket only)
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
- SEA build uses esbuild to bundle ESM → CJS as a build step. The CJS output is a build artifact, not source code. Node.js SEA requires CJS internally — there is no ESM SEA mode.
- WebSocket runs on `host: "::"` (IPv6 dual-stack). Client connects to whatever `window.location.hostname` is.
- No auth. Anyone on the LAN can join. Messages are plain text.
- Rate limit: 3 msg/sec, 5s ban on exceed.
- Binary messages (images, voice, files) bypass rate limiting.
- Rooms are server-scoped: messages only reach users in the same room.
- All runtime state (rooms, polls, stats, join codes) is RAM-only, lost on server exit.

## Code Style

Dense, no blank lines, 4-space indent, `let` for variables, semicolons always, opening braces on same line as keyword.
