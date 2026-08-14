# Local Server Chat
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A fully anonymous, lightweight, and effective chatroom for users on the same local network.  
No internet connection is required: everything runs on your own machine.

## Table of Contents

* [Purpose](#purpose)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [Commands & Shortcuts](#commands--shortcuts)
* [Network Accessibility](#network-accessibility)
* [Security & Privacy](#security--privacy)
* [Troubleshooting](#troubleshooting)
* [Technologies](#technologies)
* [Dependencies](#dependencies)
* [Favicon](#favicon)
* [Disclaimer](#disclaimer)
* [License](#license)
* [Support](#support-the-project)

## Purpose

This project provides a simple chat application that operates entirely within a local network (for example, 192.168.x.x or 10.x.x.x). It enables devices connected to the same router to exchange messages instantly without relying on any external internet service, thereby ensuring privacy, low latency, and minimal bandwidth usage.

## Features

* **Fully Anonymous:** No authentication and no account system. Users join with any username; nothing about your identity is ever stored or shared. (Client-side preferences like theme, filters, and draft messages are kept only in your own browser's `localStorage`.)
* **Random Username Generator:** Creates 5‑character usernames composed of letters (a‑z, A‑Z) and digits (0‑9). A built‑in profanity filter (via `bad-words`) automatically rejects inappropriate names and retries until a clean name is found.
* **Real‑Time Messaging:** WebSocket (port 8191) for instant communication.
* **Local IP Detection:** Automatically detects and displays the client's local IP address using `/get-client-ip` and WebSocket system messages.
* **Message Formatting:** Preserves newlines, multiple spaces, and HTML‑escapes user input.
* **Markdown Support:** **bold**, *italic*, ~~strikethrough~~, inline `code`, fenced code blocks, **tables**, and **task lists** (links are not auto‑linked for safety). A live **Preview** toggle renders your message below the input as you type.
* **Syntax Highlighting:** Over 30 languages (C, C++, Python, Java, Go, Rust, Fortran, COBOL, Zig, assembly, and more) via `highlight.js`, with a one‑click copy button on every code block.
* **Private Messaging:** `/msg "username" message` – double quotes are required for names that contain spaces.
* **Typing Indicator:** Shows who is typing in real time (scoped to the current room).
* **Dark / Light Theme:** System preference detection plus a manual toggle.
* **Emoji Picker, Emoji Shortcuts & Code Block Button:** Buttons next to the message input, plus `:smile:` style shortcuts that expand to emoji while typing.
* **Image Sharing:** Drag‑and‑drop, paste‑from‑clipboard, or pick an image (converted to WebP, resized to ≤800px, maximum 1 MB).
* **Voice Messages:** On `localhost` (a secure context) the mic records directly; over plain HTTP the button falls back to sending an audio file through the same file‑transfer path. No HTTPS required.
* **Chat Export:** Export the conversation as TXT, JSON, or HTML.
* **Clear Chat:** Client‑side clearing of the message list.
* **Reply, Forward, Copy, Ignore & Pin:** Right‑click any message (or double‑click to reply). Ignored users and blocked words are applied only to your own view and persist across reloads.
* **Auto‑scroll:** Smart scrolling with a floating "jump to bottom" button and a "New messages" divider when you scroll up.
* **Reconnect Logic:** Automatically retries when the WebSocket connection is interrupted (and re‑joins your room). Messages sent while offline are queued and flushed on reconnect.
* **Rate Limiting:** 3 messages per second; exceeding this limit results in a 5‑second temporary ban.
* **Join/Leave Notifications:** Shows who joined or left and lists the current users.
* **Chat Rooms:** Ephemeral rooms created on demand, deleted when empty. Default rooms: General, Homework, Programming, Gaming, Robotics.
* **Anonymous Polls:** Create polls with `/poll "Question" "Option1" "Option2"`. One vote per connection, results shown in real time.
* **Live Statistics:** `/stats` shows users online, messages/min, files transferred, uptime. Your own session stats (sent/received/connected time) appear in Settings.
* **Network Diagnostics:** `/diag` shows HTTP reachability, WebSocket status, latency.
* **Identicons & Color Coding:** Deterministic geometric SVG avatars plus a per‑user name color so the feed is easy to scan.
* **Join Codes:** 4‑character alphanumeric codes displayed on login with a QR code and a one‑click "Copy Link" button.
* **LAN Discovery:** Server advertises itself via UDP multicast; if multicast is firewalled, the client falls back to an HTTP scan of the local subnet.
* **End‑to‑End Encryption (optional):** Toggle in Settings – text and private messages are encrypted in the browser with AES‑GCM (key derived from a shared password, defaulting to the server's join code) before being relayed. The server only ever sees ciphertext.
* **Message Search:** Ctrl+F or the search box filters messages locally (no server involved).
* **Notifications & Sound:** Web Notifications, an unread counter in the tab title, a message sound (with a distinct ping for `@mentions`), and a Do‑Not‑Disturb timer – all client‑side.
* **Draft Persistence:** Your half‑typed message survives a page refresh.
* **Input History:** ↑/↓ recalls your previously sent messages and commands.
* **Quick Phrases:** Save reusable snippets with `/snippet add <name> <text>` and insert them with `:name:`.
* **Settings Panel:** Message density, text size, accent color, focus mode (messages only), code‑line wrapping, reduced motion, word filter, ignored users, language, and encryption settings – all stored locally.
* **Client‑Side Language Packs:** English, Spanish, French, German, and Chinese UI strings.
* **Self‑Contained Executable:** `npm run package` embeds the entire frontend into a single standalone executable per platform. No Node.js and no extra files required to run.
* **Built‑in Games:**
  * `/2048` – Play 2048.
  * `/chess` – Play chess against a computer opponent (choose Easy/Medium/Hard).
* **Automated Smoke Test:** `npm test` boots the server and verifies the join → message → poll → private → nick flow over a real WebSocket. GitHub Actions builds and tests on Windows, macOS, and Linux.
* **Mobile Optimized:** Responsive layout, larger touch targets, and custom scrollbars.

## Prerequisites

* [Node.js](https://nodejs.org/) v20.19 or later (v22+ recommended)
* NPM (included with Node.js) or [Yarn](https://yarnpkg.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/richie-rich90454/local_server_chat.git
   ```
2. Change into the project directory:

   ```bash
   cd local_server_chat
   ```
3. Install dependencies (all dependencies are automatically fetched from `package.json`):

   ```bash
   npm install
   ```
   *To install exactly the versions specified in `package-lock.json`, use `npm ci` (faster and more reliable for CI).*
4. Run the smoke test to verify everything works:

   ```bash
   npm test
   ```

## Usage

* **Development mode** (rebuilds the frontend automatically, no caching issues):

  ```bash
  npm run dev
  ```
  Then open your browser at the URL shown (for example, `http://192.168.3.97:5173`).

* **Production mode** (builds static files once, then serves them):

  ```bash
  npm run build
  node server.js
  ```
  Then open `http://<host-machine-ip>:2047`.

* **Discoverable server** (enables LAN discovery with a name):

  ```bash
  node server.js --name "Physics Classroom"
  ```

* **Headless server** (WebSocket only, no browser UI):

  ```bash
  node server.js --no-http
  ```

* **Headless discoverable server**:

  ```bash
  node server.js --no-http --name "Robotics Lab"
  ```

* **Self-contained executable** (no Node.js required, single file):

  ```bash
  npm run package
  ./LocalServerChat.exe          # Windows
  ./LocalServerChat              # Linux / macOS
  ```

  The built frontend is embedded directly into the executable, so it works standalone with no other files beside it. Users on the network just open `http://<host-ip>:2047` in any browser.

* **Client executable** (discovers and joins remote servers, serves the UI locally):

  ```bash
  npm run package-client
  ./LocalServerChatClient.exe
  ```

  Opens a browser tab with the discovery page. Servers are found via UDP multicast, or via an automatic HTTP scan of your subnet when multicast is blocked. You can also enter a server IP manually or use a join code.

* **Terminal client** (connect from command line):

  ```bash
  node LocalServerChatClient.js --host 192.168.1.50 --port 8191
  ```

### Chat flow

1. Enter a username (or click **Generate Random Username** to obtain a random clean name).
2. The IP address field will automatically show your local IP.
3. Click **Join the chat**.
4. Type messages. Press **Shift+Enter** to send; pressing **Enter** alone inserts a newline. You may also click **Send Message**.
5. Messages preserve line breaks, spaces, and Markdown formatting. Your own messages appear in red.

## Commands & Shortcuts

### Browser Client

Type any of the following commands in the message input and send it (using **Shift+Enter** or the Send button):

| Command | Description |
|---------|-------------|
| `/users` | List all online users. |
| `/msg "username" message` | Send a private message (use double quotes around the username if it contains spaces). |
| `/poll "Question" "Option1" "Option2"` | Create an anonymous poll. Click vote buttons to vote. |
| `/nick <newname>` | Change your username. |
| `/stats` | Show live session statistics. |
| `/diag` | Run network diagnostics. |
| `/ping` | Measure connection latency. |
| `/clear` | Clear all messages from your view. |
| `/clear <N>` | Clear last N messages. |
| `/snippet add <name> <text>` | Save a reusable snippet, inserted later as `:name:`. |
| `/snippet del <name>` | Delete a saved snippet. |
| `/snippet list` | List saved snippets. |
| `/shortcuts` | Show keyboard shortcuts. |
| `/2048` | Play a 2048 game in a modal window. |
| `/chess` | Play chess against the computer (Easy/Medium/Hard). |
| `/help` | Display available commands and keyboard shortcuts. |

### Terminal Client

| Command | Description |
|---------|-------------|
| `/nick <name>` | Change username. |
| `/msg "user" message` | Send private message. |
| `/users` | List online users. |
| `/rooms` | List available rooms. |
| `/join <room>` | Join a room. |
| `/stats` | Show session statistics. |
| `/ping` | Measure latency. |
| `/help` | Show commands. |
| `/quit` | Exit. |

**Keyboard shortcuts** (inside the message textarea):

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Wrap selected text with `**bold**`. |
| `Ctrl+I` | Wrap selected text with `*italic*`. |
| `Ctrl+M` | Wrap selected text with `` `code` ``. |
| `Ctrl+F` | Focus the local message search box. |
| `↑` / `↓` | Recall previously sent messages and commands. |
| `Shift+Enter` | Send the message. |

**UI buttons adjacent to the textarea:**

- 🙂 **Emoji picker** – click to select an emoji; it will be inserted at the cursor position.
- `</>` **Code block** – inserts a Markdown code fence `` ``` `` `` ``` `` (optionally with a language tag).
- **Preview** – toggles a live Markdown preview of your message below the input.
- ⚙ **Settings** (in the header) – sound, Do‑Not‑Disturb, density, focus mode, text size, accent color, code wrapping, reduced motion, word filter, ignored users, language, and encryption.

## Network Accessibility

To allow other devices on your local network to connect, you may need to open the required ports in your firewall.

### Port Numbers

* **HTTP UI (static files):** `2047`
* **WebSocket server (real‑time messaging):** `8191`
* **UDP multicast (LAN discovery):** `9876`

**All three ports must be accessible** for full functionality. The browser loads the page on port 2047 and then opens a WebSocket connection to port 8191. UDP multicast on port 9876 enables automatic server discovery; if multicast is blocked by your network, the client executable also scans the local subnet over HTTP as a fallback.

> If you are running in **development mode** with `npm run dev`, Vite’s dev server uses port **5173** for the UI. That port must also be open if you wish for other devices to access the development build.

### Linux (Debian/Ubuntu)

```bash
sudo ufw allow 2047/tcp
sudo ufw allow 8191/tcp
sudo ufw allow 9876/udp
```

### Windows (PowerShell as Administrator)

Open **PowerShell as Administrator** (right‑click Windows Start → Windows PowerShell (Admin) or Terminal (Admin)), then run:

```powershell
New-NetFirewallRule -DisplayName "Local Server Chat HTTP" -Direction Inbound -Protocol TCP -LocalPort 2047 -Action Allow
New-NetFirewallRule -DisplayName "Local Server Chat WebSocket" -Direction Inbound -Protocol TCP -LocalPort 8191 -Action Allow
New-NetFirewallRule -DisplayName "Local Server Chat Discovery" -Direction Inbound -Protocol UDP -LocalPort 9876 -Action Allow
```

> **Important:** You must run PowerShell **as Administrator** for these commands to succeed. To remove the rules at a later time:
> ```powershell
> Remove-NetFirewallRule -DisplayName "Local Server Chat HTTP"
> Remove-NetFirewallRule -DisplayName "Local Server Chat WebSocket"
> Remove-NetFirewallRule -DisplayName "Local Server Chat Discovery"
> ```

Once the ports are open, any device on the same subnet (for example, `192.168.x.x`, `10.x.x.x`, `172.16.x.x`) can access the chat at:

```
http://<host-machine-ip>:2047
```

## Security & Privacy

- **Optional end‑to‑end encryption:** By default, messages are relayed in plain text. Enabling **End‑to‑End Encryption** in Settings encrypts text and private messages in the browser with AES‑GCM before they are sent; the server only ever sees ciphertext. The key is derived from a shared password, which defaults to the server's join code (shown on the login screen), so everyone on the same server can decrypt automatically. Both sides must use the same password.
- **No authentication:** Any device that can reach the server's IP address and ports may join with any username. There is no password or account system.
- **No data retention:** Messages exist only in the browser's memory. Refreshing the page clears all chat history (no server‑side storage is used).
- **Client‑side privacy controls:** You can mute/ignore specific users, filter blocked words, and clear your view – all applied locally and never shared with the server.
- **Voice messages:** Audio is sent as a file through the same peer‑to‑peer WebSocket path and never leaves the local network.

This project is intended for **trusted local networks**. Do not use it to exchange sensitive information unless you add your own encryption layer.

## Troubleshooting

### “Connection refused” or WebSocket error
- Verify that both **port 2047** and **port 8191** are open in the host’s firewall (see [Network Accessibility](#network-accessibility)).
- Ensure the server is running and listening on `0.0.0.0` (not `127.0.0.1`). The default configuration should already satisfy this requirement.

### Other devices cannot open the page
- Confirm that all devices are on the **same local network** and can ping each other.
- Check that the host machine’s firewall is not blocking incoming connections.
- Attempt to access `http://<host-ip>:2047` from another device’s browser. If the attempt fails, investigate whether a VPN or network isolation feature is interfering.

### Voice recording does not work
- The browser's microphone API requires a **secure context**: `localhost` (or `127.0.0.1`) or HTTPS. If you access the chat over plain HTTP from a remote device, the browser blocks mic capture.
- Over plain HTTP the voice button automatically falls back to **sending an audio file** (pick an `.mp3`/`.wav`/`.ogg`), which works on any connection.
- **Workaround for real mic capture on a LAN:** In Chrome, start the browser with `--unsafely-treat-insecure-origin-as-secure="http://<host-ip>:2047"` (use this flag only on trusted networks).
- For production use on a LAN, consider configuring a self‑signed HTTPS certificate.

### Port already in use
- Change the port in the source code (search for `2047` and `8191` in `server.js` and the client code) or use environment variables if they are supported (consult the project’s documentation).
- To free a port, locate the process using it (for example, `lsof -i :2047` on Linux/macOS, or `netstat -ano | findstr :2047` on Windows) and terminate it.

### Messages are not sent (rate limiting)
- You are sending messages too rapidly. Wait a few seconds for the rate‑limit ban to expire (5 seconds).

## Technologies

* **Server:** Node.js, Express, [ws](https://www.npmjs.com/package/ws), [bad-words](https://www.npmjs.com/package/bad-words), UDP multicast + HTTP subnet scan (LAN discovery)
* **Client:** HTML5, CSS3, JavaScript (ES6 modules), [highlight.js](https://highlightjs.org/), [chess.js](https://github.com/jhlywa/chess.js), [qrcode](https://www.npmjs.com/package/qrcode), Web Notifications, Web Audio
* **Encryption:** [@noble/ciphers](https://www.npmjs.com/package/@noble/ciphers) + [@noble/hashes](https://www.npmjs.com/package/@noble/hashes) (pure‑JS AES‑GCM, works over plain HTTP)
* **Styling:** Custom CSS with CSS variables, bundled [Noto Sans](https://fonts.google.com/specimen/Noto+Sans) fonts (local first, Google Fonts as fallback), responsive design
* **Build Tool:** [Vite](https://vitejs.dev/) with Lightning CSS transformer
* **Packaging:** Node.js [Single Executable Applications](https://nodejs.org/api/single-executable-applications.html) (SEA) via [esbuild](https://esbuild.github.io/) + [postject](https://www.npmjs.com/package/postject) – the frontend is embedded in the executable
* **CI/CD:** GitHub Actions (Windows, macOS, Linux) running `npm test` and building the executables, with automated GitHub releases on version tags
* **Games:** Self‑contained 2048 and chess (human versus computer)

## Dependencies

All dependencies are listed in `package.json` and are automatically installed with `npm install`. Key runtime dependencies include:

- `express` – HTTP server
- `ws` – WebSocket server
- `bad-words` – Profanity filter for usernames
- `highlight.js` – Syntax highlighting for code blocks
- `chess.js` – Chess game logic
- `qrcode` – QR code generation for join codes
- `@noble/ciphers`, `@noble/hashes` – Client-side AES-GCM encryption for optional E2E messaging
- `highlightjs-zig`, `highlightjs-cobol` – Additional language support

Development dependencies include Vite, its HTML plugin, esbuild, and `postject` for building the standalone executables. `npm test` runs a protocol-level smoke test (`scripts/smoke-test.js`) that boots the server and exercises join, messaging, polls, private messages, and nickname changes over a real WebSocket.

## Favicon

The project favicon was generated using [favicon.io](https://favicon.io/).

## Disclaimer

**This software is provided “as is”, without any warranties.** It runs entirely on the user’s local network; no messages are stored on any external server. Users are solely responsible for their own conduct. The creator assumes **no liability** for any misuse, offensive content, data loss, or legal consequences arising from the use of this software. By using this software, you agree that you will not use it for any illegal or malicious purposes.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Support the Project

If you find this project useful or interesting, please consider giving it a **star** on GitHub.  
Doing so helps others discover the project and motivates continued development.

[![Star History Chart](https://api.star-history.com/svg?repos=richie-rich90454/local_server_chat&type=Date)](https://star-history.com/#richie-rich90454/local_server_chat)