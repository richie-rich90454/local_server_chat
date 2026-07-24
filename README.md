# Local Server Chat
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
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

* **Fully Anonymous:** No authentication, no localStorage, no cookies. Users join with any username.
* **Random Username Generator:** Creates 5‑character usernames composed of letters (a‑z, A‑Z) and digits (0‑9). A built‑in profanity filter (via `bad-words`) automatically rejects inappropriate names and retries until a clean name is found.
* **Real‑Time Messaging:** WebSocket (port 8191) for instant communication.
* **Local IP Detection:** Automatically detects and displays the client's local IP address using `/get-client-ip` and WebSocket system messages.
* **Message Formatting:** Preserves newlines, multiple spaces, and HTML‑escapes user input.
* **Markdown‑lite Support:** **bold**, *italic*, inline `code`, and fenced code blocks (links are not auto‑linked for safety).
* **Syntax Highlighting:** Over 30 languages (C, C++, Python, Java, Go, Rust, Fortran, COBOL, Zig, assembly, and more) via `highlight.js`.
* **Private Messaging:** `/msg "username" message` – double quotes are required for names that contain spaces.
* **Typing Indicator:** Shows who is typing in real time.
* **Dark / Light Theme:** System preference detection plus a manual toggle.
* **Emoji Picker & Code Block Button:** Buttons next to the message input allow quick insertion of emojis or Markdown code fences.
* **Image Sharing:** Drag and drop images (converted to WebP, resized to ≤800px, maximum 1 MB).
* **Voice Messages:** Record and send audio. Requires HTTPS or localhost (or a browser flag – see the Troubleshooting section).
* **Chat Export:** Export the conversation as TXT, JSON, or HTML.
* **Clear Chat:** Client‑side clearing of the message list.
* **Reply & Forward:** Right‑click any message to reply or forward to another user.
* **Auto‑scroll:** Smart scrolling with a floating “jump to bottom” button.
* **Reconnect Logic:** Automatically retries when the WebSocket connection is interrupted.
* **Rate Limiting:** 3 messages per second; exceeding this limit results in a 5‑second temporary ban.
* **Join/Leave Notifications:** Shows who joined or left and lists the current users.
* **Built‑in Games:**
  * `/2048` – Play 2048.
  * `/chess` – Play chess against a computer opponent (random legal moves).
* **Mobile Optimized:** Responsive layout, larger touch targets, and custom scrollbars.

## Prerequisites

* [Node.js](https://nodejs.org/) v18 or later
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

### Chat flow

1. Enter a username (or click **Generate Random Username** to obtain a random clean name).
2. The IP address field will automatically show your local IP.
3. Click **Join the chat**.
4. Type messages. Press **Shift+Enter** to send; pressing **Enter** alone inserts a newline. You may also click **Send Message**.
5. Messages preserve line breaks, spaces, and Markdown formatting. Your own messages appear in red.

## Commands & Shortcuts

Type any of the following commands in the message input and send it (using **Shift+Enter** or the Send button):

| Command | Description |
|---------|-------------|
| `/users` | List all online users. |
| `/msg "username" message` | Send a private message (use double quotes around the username if it contains spaces). |
| `/2048` | Play a 2048 game in a modal window. |
| `/chess` | Play chess against the computer (random legal moves). |
| `/help` | Display available commands and keyboard shortcuts. |

**Keyboard shortcuts** (inside the message textarea):

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Wrap selected text with `**bold**`. |
| `Ctrl+I` | Wrap selected text with `*italic*`. |
| `Ctrl+M` | Wrap selected text with `` `code` ``. |

**UI buttons adjacent to the textarea:**

- 🙂 **Emoji picker** – click to select an emoji; it will be inserted at the cursor position.
- `</>` **Code block** – inserts a Markdown code fence `` ``` `` `` ``` `` (optionally with a language tag).

## Network Accessibility

To allow other devices on your local network to connect, you may need to open the required ports in your firewall.

### Port Numbers

* **HTTP UI (static files):** `2047`
* **WebSocket server (real‑time messaging):** `8191`

**Both ports must be accessible** for the chat to function properly. The browser loads the page on port 2047 and then opens a WebSocket connection to port 8191.

> If you are running in **development mode** with `npm run dev`, Vite’s dev server uses port **5173** for the UI. That port must also be open if you wish for other devices to access the development build.

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

> **Important:** You must run PowerShell **as Administrator** for these commands to succeed. To remove the rules at a later time:
> ```powershell
> Remove-NetFirewallRule -DisplayName "Local Server Chat HTTP"
> Remove-NetFirewallRule -DisplayName "Local Server Chat WebSocket"
> ```

Once the ports are open, any device on the same subnet (for example, `192.168.x.x`, `10.x.x.x`, `172.16.x.x`) can access the chat at:

```
http://<host-machine-ip>:2047
```

## Security & Privacy

- **No encryption:** Messages are transmitted in plain text over WebSocket and HTTP. Any device on the local network equipped with packet‑sniffing tools could read them.
- **No authentication:** Any device that can reach the server’s IP address and ports may join with any username. There is no password or account system.
- **No data retention:** Messages exist only in the browser’s memory. Refreshing the page clears all chat history (no server‑side storage is used).
- **Voice messages:** Audio is recorded and sent within the browser; it never leaves the local network, but without HTTPS it is also unprotected.

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
- Voice messages require a **secure context**: either `localhost` (or `127.0.0.1`) or HTTPS. If you access the chat over plain HTTP from a remote device, the browser will block voice recording.
- **Workaround:** In Chrome, you may start the browser with the flag `--unsafely-treat-insecure-origin-as-secure="http://<host-ip>:2047"` (use this flag only on trusted networks).
- For production use on a LAN, consider configuring a self‑signed HTTPS certificate.

### Port already in use
- Change the port in the source code (search for `2047` and `8191` in `server.js` and the client code) or use environment variables if they are supported (consult the project’s documentation).
- To free a port, locate the process using it (for example, `lsof -i :2047` on Linux/macOS, or `netstat -ano | findstr :2047` on Windows) and terminate it.

### Messages are not sent (rate limiting)
- You are sending messages too rapidly. Wait a few seconds for the rate‑limit ban to expire (5 seconds).

## Technologies

* **Server:** Node.js, Express, [ws](https://www.npmjs.com/package/ws), [bad-words](https://www.npmjs.com/package/bad-words)
* **Client:** HTML5, CSS3, JavaScript (ES6 modules), [highlight.js](https://highlightjs.org/), [chess.js](https://github.com/jhlywa/chess.js)
* **Styling:** Custom CSS with CSS variables, [Noto Sans](https://fonts.google.com/specimen/Noto+Sans), responsive design
* **Build Tool:** [Vite](https://vitejs.dev/) with Lightning CSS transformer
* **Games:** Self‑contained 2048 and chess (human versus computer)

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

**This software is provided “as is”, without any warranties.** It runs entirely on the user’s local network; no messages are stored on any external server. Users are solely responsible for their own conduct. The creator assumes **no liability** for any misuse, offensive content, data loss, or legal consequences arising from the use of this software. By using this software, you agree that you will not use it for any illegal or malicious purposes.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Support the Project

If you find this project useful or interesting, please consider giving it a **star** on GitHub.  
Doing so helps others discover the project and motivates continued development.

[![Star History Chart](https://api.star-history.com/svg?repos=richie-rich90454/local_server_chat&type=Date)](https://star-history.com/#richie-rich90454/local_server_chat)