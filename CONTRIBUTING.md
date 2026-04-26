# Contributing to Local Server Chat

Thank you for your interest in contributing! 🎉
This project is designed to be simple, fast, and privacy-focused. Contributions that align with these goals are highly appreciated.

---

## 🚀 Getting Started

### 1. Fork the Repository

Click the **Fork** button on GitHub, then clone your fork:

```bash
git clone https://github.com/<your-username>/local_server_chat.git
cd local_server_chat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Project

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
node server.js
```

---

## 🧠 Project Philosophy

Before contributing, understand the core principles:

* **Local-first**: No reliance on external servers
* **Anonymous**: No accounts, authentication, or tracking
* **Lightweight**: Minimal dependencies and fast performance
* **Privacy-focused**: No data persistence beyond the session

Contributions that conflict with these goals may not be accepted.

---

## 🛠️ Ways to Contribute

### 🐛 Bug Reports

If you find a bug:

1. Check existing issues first
2. Open a new issue with:

   * Clear description
   * Steps to reproduce
   * Expected vs actual behavior
   * Environment details (OS, browser, Node.js)

---

### 💡 Feature Requests

Before suggesting a feature:

* Consider if it fits the project philosophy
* Keep it simple and local-first

Open an issue with:

* Use case
* Proposed solution
* Alternatives considered

---

### 🔧 Code Contributions

#### Workflow

1. Fork the repo
2. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes
4. Commit with a clear message:

```bash
git commit -m "feat: add typing indicator debounce"
```

5. Push your branch:

```bash
git push origin feature/your-feature-name
```

6. Open a Pull Request

---

## 📐 Code Guidelines

### General

* Keep code **simple and readable**
* Avoid unnecessary dependencies
* Prefer **vanilla JavaScript** over heavy libraries
* Maintain consistent formatting

### Frontend

* Use semantic HTML
* Keep CSS modular and minimal
* Respect existing design patterns (dark/light mode support)

### Backend

* Keep the server lightweight (Express + ws only)
* Avoid adding database dependencies
* Ensure WebSocket logic remains efficient

---

## 🔒 Security

* Do NOT introduce features that expose the app to the public internet by default
* Validate and sanitize user input
* Avoid introducing XSS or injection risks

If you discover a vulnerability, follow `SECURITY.md`.

---

## 🧪 Testing Your Changes

Before submitting:

* Run the app locally
* Test on multiple browsers if possible
* Check:

  * Messaging works
  * Reconnect logic works
  * UI responsiveness (mobile + desktop)
  * Dark/light mode

---

## 📁 Project Structure Overview

```
src/        → frontend (HTML, CSS, JS)
server.js   → backend (Express + WebSocket)
public/     → static assets
```

---

## 📝 Commit Message Guidelines

Use clear, conventional messages:

* `feat:` new feature
* `fix:` bug fix
* `docs:` documentation
* `refactor:` code cleanup
* `style:` formatting only
* `chore:` maintenance

Example:

```bash
feat: add private messaging command parsing
fix: prevent duplicate username edge case
```

---

## 🔍 Pull Request Guidelines

Your PR should:

* Have a clear title and description
* Reference related issues (if any)
* Be focused (avoid huge unrelated changes)
* Pass manual testing

---

## ❌ What Not to Contribute

* Heavy frameworks (React, Angular, etc.)
* Authentication systems or user tracking
* Cloud integrations or external APIs
* Overly complex features that bloat the project

---

## 💬 Need Help?

* Use **Discussions** for questions and ideas
* Use **Issues** for bugs and feature requests

---

## ❤️ Final Notes

* Small contributions are welcome
* Clean, focused PRs are preferred over large ones
* Respect the simplicity of the project

Thanks for contributing to **Local Server Chat**!
