# Local Server Chat
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A fully anonymous, lightweight, and effective chatroom for users on the same local network.

## Table of Contents

* [Purpose](#purpose)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [Commands & Shortcuts](#commands--shortcuts)
* [Network Accessibility](#network-accessibility)
* [Technologies](#technologies)
* [Dependencies](#dependencies)
* [Favicon](#favicon)
* [Disclaimer](#disclaimer)
* [License](#license)
* [Support](#support-the-project)

## Purpose

This project provides a simple chat application that operates entirely within a local network (e.g., 192.168.x.x, 10.x.x.x). It enables devices under the same router to exchange messages instantly without relying on any external internet service, ensuring privacy, low latency, and minimal bandwidth usage.

## Features

* **Fully Anonymous:** No authentication, no localStorage, no cookies. Users join with any username.
* **Random Username Generator:** Creates 5‑character unique‑letter usernames (a‑z, 0‑9, A‑Z). Built‑in profanity filter (via `bad-words`) automatically rejects inappropriate names and retries until a clean name is found.
* **Real‑Time Messaging:** WebSocket (port 8191) for instant communication.
* **Local IP Detection:** Automatically detects and displays the client's local IP address using `/get-client-ip` and WebSocket system messages.
* **Message Formatting:** Preserves newlines, multiple spaces, and HTML‑escapes user input.
* **Markdown‑lite Support:** **bold**, *italic*, inline `code`, and fenced code blocks.
* **Syntax Highlighting:** Over 30 languages (C, C++, Python, Java, Go, Rust, Fortran, COBOL, Zig, assembly, and more) via `highlight.js`.
* **Private Messaging:** `/msg "username" message` – double quotes required for names with spaces.
* **Typing Indicator:** Shows who is typing in real time.
* **Dark / Light Theme:** System preference detection plus manual toggle.
* **Emoji Picker & Code Block Button:** Quick insertion of emojis or markdown code blocks.
* **Image Sharing:** Drag & drop images (converted to WebP, resized to ≤800px, max 1 MB).
* **Voice Messages:** Requires HTTPS or localhost (or browser flag). Record and send audio.
* **Chat Export:** Export conversation as TXT, JSON, or HTML.
* **Clear Chat:** Client‑side clearing of message list.
* **Reply & Forward:** Right‑click any message to reply or forward to another user.
* **Auto‑scroll:** Smart scrolling with a floating “jump to bottom” button.
* **Reconnect Logic:** Automatically retries when WebSocket disconnects.
* **Rate Limiting:** 3 messages per second; exceeding results in a 5‑second temporary ban.
* **Join/Leave Notifications:** Shows who joined/left and lists current users.
* **Built‑in Games:**
  * `/2048` – Play 2048.
  * `/chess` – Play chess against a computer opponent (random legal moves).
* **Mobile Optimized:** Responsive layout, larger touch targets, custom scrollbars.

## Prerequisites

* [Node.js](https://nodejs.org/) v18+
* NPM (comes with Node.js) or [Yarn](https://yarnpkg.com/)

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

## Usage

* **Development mode** (rebuilds frontend automatically, no caching issues):

  ```bash
  npm run dev
  ```
  Then open your browser at the URL shown (e.g., `http://192.168.3.97:5173`).

* **Production mode** (builds static files once, then serves them):

  ```bash
  npm run build
  node server.js
  ```
  Then open `http://<host-machine-ip>:2047`.

1. Enter a username (or click **Generate a Five Character Username** to get a random clean name).
2. The IP address field will automatically show your local IP.
3. Click **Join the chat**.
4. Type messages and press **Shift+Enter** or click **Send Message**.
5. Messages preserve line breaks, spaces, and Markdown formatting. Your own messages appear in red.

## Commands & Shortcuts

Type any of the following commands in the message input and press **Shift+Enter** (or click Send Message):

| Command | Description |
|---------|-------------|
| `/users` | List all online users. |
| `/msg "username" message` | Send a private message (use double quotes around username if it contains spaces). |
| `/2048` | Play a 2048 game in a modal window. |
| `/chess` | Play chess against the computer (random legal moves). |
| `/help` | Display available commands and keyboard shortcuts. |

**Keyboard shortcuts** (inside the message textarea):

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Wrap selected text with `**bold**`. |
| `Ctrl+I` | Wrap selected text with `*italic*`. |
| `Ctrl+M` | Wrap selected text with `` `code` ``. |

## Network Accessibility

To allow other devices on your local network to connect, you may need to open the server ports in your firewall.

### Port Numbers

* **WebSocket server:** `8191`
* **HTTP UI:** `2047`
* **Vite dev server (development only):** `5173`

### Linux (Debian/Ubuntu)

```bash
sudo ufw allow 2047/tcp
sudo ufw allow 8191/tcp
```

### Windows (PowerShell as Administrator)

Open **PowerShell as Administrator** (right‑click Windows Start → Windows PowerShell (Admin) or Terminal (Admin)), then run:

```powershell
New-NetFirewallRule -DisplayName "Local Server Chat HTTP" -Direction Inbound -Protocol TCP -LocalPort 2047 -Action Allow
New-NetFirewallRule -DisplayName "Local Server Chat WebSocket" -Direction Inbound -Protocol TCP -LocalPort 8191 -Action Allow
```

> **Important:** You must run PowerShell **as Administrator** for these commands to work. If you later want to remove the rules, use:
> ```powershell
> Remove-NetFirewallRule -DisplayName "Local Server Chat HTTP"
> Remove-NetFirewallRule -DisplayName "Local Server Chat WebSocket"
> ```

Once the ports are open, any device on the same subnet (e.g., `192.168.x.x`, `10.x.x.x`, `172.16.x.x`) can access the chat at:

```
http://<host-machine-ip>:2047
```

## Technologies

* **Server:** Node.js, Express, [ws](https://www.npmjs.com/package/ws), [bad-words](https://www.npmjs.com/package/bad-words)
* **Client:** HTML5, CSS3, JavaScript (ES6 modules), [highlight.js](https://highlightjs.org/), [chess.js](https://github.com/jhlywa/chess.js)
* **Styling:** Custom CSS with CSS variables, [Noto Sans](https://fonts.google.com/specimen/Noto+Sans), responsive design
* **Build Tool:** [Vite](https://vitejs.dev/) with Lightning CSS transformer
* **Games:** Self‑contained 2048 and chess (human vs computer)

## Dependencies

All dependencies are listed in `package.json` and are automatically installed with `npm install`. Key runtime dependencies include:

- `express` – HTTP server
- `ws` – WebSocket server
- `bad-words` – Profanity filter for usernames
- `highlight.js` – Syntax highlighting for code blocks
- `chess.js` – Chess game logic
- `highlightjs-zig`, `highlightjs-cobol` – Additional language support

Development dependencies include Vite and its HTML plugin.

## Favicon

The project favicon was generated using [favicon.io](https://favicon.io/).

## Disclaimer

**This software is provided “as is”, without any warranties.** It runs entirely on the user’s local network; no messages are stored on any external server. Users are solely responsible for their own conduct. The creator assumes **no liability** for any misuse, offensive content, data loss, or any legal consequences arising from the use of this software. By using this software, you agree that you will not use it for any illegal or malicious purposes.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Support the Project

If you find this project useful or interesting, please consider giving it a **star** on GitHub.  
It helps others discover the project and motivates continued development.

[![Star History Chart](https://api.star-history.com/svg?repos=richie-rich90454/local_server_chat&type=Date)](https://star-history.com/#richie-rich90454/local_server_chat)