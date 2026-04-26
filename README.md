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

## Support the Project

If you find this project useful or interesting, please consider giving it a **star** on GitHub.  
It helps others discover the project and motivates continued development.

[![Star History Chart](https://api.star-history.com/svg?repos=richie-rich90454/local_server_chat&type=Date)](https://star-history.com/#richie-rich90454/local_server_chat)

now update README.md with all of my changes and fully polish it (no emojis)
use the tone and writing style of my writing of my handwritten thig here before:
Well, the question comes on how to use it.
First, you git clone the entire repo.
Next, you cd to the directory of the repo.
Next, you type node server.js.
Then, you click on the UI option (w/ port 2047).
Finally, you could use the app.

By the way, if you want to make this accessible in your local network, the whole point of this I guess, (e.g. the one given to your devices by your router starting with 192.168.0.0/16, 172.16.0.0/12, 10.0.0.0/8 etc.), you would need to allow traffic (inbound) through the ports 2047 and 8191 (I have no apparent reason for choosing these; I guess it is because they are either a Mersenne Composite or Mersenne Prime number).
    For Linux (Debian), this is rather easy; you just need to sudo ufw allow 2047 and sudo ufw allow 8191.
    For Windows, you would need to go to firewall settings and allow inbound traffic from these two ports with TCP in the local network.
To access the ui, you simply type http://(machine you are running the ws server on):2047 on a machine under the same router.

Favicon generated by favicon.io

Purpose/Description:
This project aims to bring a public, fully anonymous, lightweight, and effective chatroom for people under the same router (i.e. under the same network) to chat in and exchange their thoughts. This project accomplishes this via JavaScript (including Node.js modules) and HTML (with CSS for simplistic styling) and is therefore extremely lightweight to deploy and rather clear and concise to use due to its simplicity. This project would therefore mostly relate to prompt 2, as this program allows people to connect with each other and exchange their thoughts. For instance, people on the same network could quickly inform each other of a small task such as bringing a cup of coffee for them rather than (frankly) wasting internet bandwidth and electricity for the message to go potentially cross-seas to a social media server and then back, which is slow, wastes bandwidth, and require an internet connection (ISP service). This, in the coffee example, might allow the two people to develop a friendship and probably bring an overall more cooperative environment to work or study in due to messages being reliably delivered, which is definitely beneficial to society. Therefore, the program does have a practical use case and could offer quantifiable benefits. Additionally, this program could have a lot of further potential, as it could be easily modified for use with a public IP (if the user has one) and be a potential alternative to traditional social media (the structure is not technically Peer-to-Peer due to it requiring a user to host a server, but it behaves in a similar way with anonymity and security).
taek note of this
{
    "name": "local_server_chat",
    "version": "2.0.0",
    "type": "module",
    "dependencies": {
        "2048-webcomponent": "^1.1.0",
        "bad-words": "^4.0.0",
        "express": "^5.2.1",
        "highlight.js": "^11.11.1",
        "highlightjs-cobol": "^0.3.3",
        "highlightjs-zig": "^1.0.2",
        "ws": "^8.20.0"
    },
    "main": "server.js",
    "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1",
        "start": "node server.js",
        "dev": "vite dev",
        "build": "vite build"
    },
    "keywords": [
        "WebSocket",
        "Chat",
        "Intranet chat"
    ],
    "author": "richie-rich90454",
    "license": "Apache-2.0",
    "description": "It should just be a chat app.",
    "devDependencies": {
        "vite": "^8.0.10",
        "vite-plugin-html": "^3.2.2"
    }
}