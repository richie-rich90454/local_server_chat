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
* [License](#license)

## Purpose

This project provides a simple chat application that operates entirely within a local network (e.g., 192.168.x.x, 10.x.x.x). It enables devices under the same router to exchange messages instantly without relying on any external internet service, ensuring privacy, low latency, and minimal bandwidth usage.

## Features

* **Fully Anonymous:** No user authentication; users join with any username.
* **Lightweight:** Pure JavaScript (Node.js) on the server and vanilla HTML/CSS/JS on the client.
* **Real-Time Messaging:** Built with WebSocket for instant communication.
* **Cross-Platform:** Works on Windows, Linux, and macOS.

## Prerequisites

* [Node.js](https://nodejs.org/) v14+
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

1. Start the server:

   ```bash
   node server.js
   ```
2. Open your browser and navigate to the UI at `http://<host-machine-ip>:2047`.
3. Enter a username and click **Join the chat**.
4. Start sending messages in the chat interface.

## Network Accessibility

To allow other devices on your local network to connect, you may need to open the server ports in your firewall.

### Port Numbers

* **WebSocket server:** `8191`
* **HTTP UI:** `2047`

### Linux (Debian/Ubuntu)

```bash
sudo ufw allow 2047/tcp
sudo ufw allow 8191/tcp
```

### Windows

1. Open **Windows Defender Firewall**.
2. Go to **Advanced settings** → **Inbound Rules**.
3. Create a new rule to allow TCP traffic on ports **2047** and **8191**.

Once the ports are open, any device on the same subnet (e.g., `192.168.x.x`, `10.x.x.x`, `172.16.x.x`) can access the chat at:

```
http://<host-machine-ip>:2047
```

## Technologies

* **Server:** Node.js, Express, [ws](https://www.npmjs.com/package/ws)
* **Client:** HTML5, CSS3, JavaScript (ES6 modules)
* **Styling:** Custom CSS with [Noto Sans](https://fonts.google.com/specimen/Noto+Sans)

## Favicon

The project favicon was generated using [favicon.io](https://favicon.io/).

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
