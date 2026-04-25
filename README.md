# Local Server Chat

A fully anonymous, lightweight, and effective chatroom for users on the same local network.

## Table of Contents

* [Purpose](#purpose)
* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)
* [Network Accessibility](#network-accessibility)
* [Technologies](#technologies)
* [Favicon](#favicon)
* [Disclaimer](#disclaimer)
* [License](#license)

## Purpose

This project provides a simple chat application that operates entirely within a local network (e.g., 192.168.x.x, 10.x.x.x). It enables devices under the same router to exchange messages instantly without relying on any external internet service, ensuring privacy, low latency, and minimal bandwidth usage.

## Features

* **Fully Anonymous:** No user authentication, no localStorage, no cookies. Users join with any username.
* **Random Username Generator:** Creates 5‑character unique‑letter usernames (a‑z, 0‑9, A‑Z). Built‑in profanity filter (via `bad‑words`) automatically rejects inappropriate names and retries until a clean name is found.
* **Real‑Time Messaging:** Built with WebSocket for instant communication.
* **Local IP Detection:** Automatically detects and displays the client’s local IP address using `/get-client-ip` and WebSocket system messages.
* **Cross‑Platform & Mobile Optimized:** Works on Windows, Linux, macOS, and adapts to iPad/iPhone screens with touch‑friendly buttons and improved spacing.
* **Message Formatting:** Preserves newlines, multiple spaces, and HTML‑escapes user input for safety.

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
3. Install dependencies:

   ```bash
   npm install
   ```

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
5. Messages preserve line breaks and spaces. Your own messages appear in red.

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

* **Server:** Node.js, Express, [ws](https://www.npmjs.com/package/ws), [bad-words](https://www.npmjs.com/package/bad-words) for profanity filtering
* **Client:** HTML5, CSS3, JavaScript (ES6 modules, async/await)
* **Styling:** Custom CSS with [Noto Sans](https://fonts.google.com/specimen/Noto+Sans) and mobile‑friendly media queries
* **Build Tool:** [Vite](https://vitejs.dev/) for fast development and optimized production builds

## Favicon

The project favicon was generated using [favicon.io](https://favicon.io/).

## Disclaimer

**This software is provided “as is”, without any warranties.** It runs entirely on the user’s local network; no messages are stored on any external server. Users are solely responsible for their own conduct. The creator assumes **no liability** for any misuse, offensive content, data loss, or any legal consequences arising from the use of this software. By using this software, you agree that you will not use it for any illegal or malicious purposes.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.