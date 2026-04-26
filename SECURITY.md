# Security Policy

## Supported Versions

The following versions of **Local Server Chat** are currently supported with security updates:

| Version | Supported |
| ------- | --------- |
| Latest  | ✅ Yes     |
| Older   | ❌ No      |

> Only the most recent version receives security fixes. Please upgrade regularly to stay protected.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public issue.**

Instead, report it privately via one of the following methods:

* Email: **[[your-email@example.com](mailto:your-email@example.com)]**
* GitHub: Use the **"Report a vulnerability"** feature under the Security tab (if enabled)

---

## What to Include

To help resolve the issue quickly, include:

* A clear description of the vulnerability
* Steps to reproduce the issue
* Potential impact (e.g., data exposure, denial of service)
* Screenshots or proof-of-concept (if applicable)
* Your environment (OS, browser, Node.js version)

---

## Response Timeline

We aim to:

* **Acknowledge** reports within 48 hours
* **Assess and triage** within 3–5 days
* **Provide a fix or mitigation** as soon as possible depending on severity

You may be contacted for further details during the investigation.

---

## Security Considerations

This project is designed to run **entirely within a local network**, which changes the threat model:

### Key Assumptions

* All users are on the same trusted LAN (e.g., home, school, office)
* No external internet exposure is required

### Known Risks

Even in a local network, risks still exist:

* **Malicious local users** (spam, abuse, flooding)
* **Packet sniffing** if the network is not secure (no HTTPS by default)
* **Denial of Service (DoS)** via excessive connections or messages
* **Impersonation** (no authentication system by design)

---

## Built-in Protections

Local Server Chat includes several safeguards:

* **Rate limiting:** 3 messages/sec with temporary bans
* **HTML escaping:** Prevents basic XSS attacks
* **Username filtering:** Blocks profanity via `bad-words`
* **No persistent storage:** Messages are not saved server-side
* **Client-side controls:** Clear chat, export, and moderation tools

---

## Recommended Deployment Practices

To improve security in real-world usage:

### Network

* Run only on **trusted private networks**
* Avoid exposing ports (`2047`, `8191`) to the public internet
* Use a firewall to restrict access if needed

### Encryption

* Use a **reverse proxy with HTTPS** (e.g., Nginx, Caddy) if handling:

  * Voice messages
  * Sensitive communication

### System

* Keep **Node.js (v18+)** up to date
* Regularly update dependencies (`npm update`)
* Monitor logs for unusual activity

---

## Out of Scope

The following are **not considered vulnerabilities**:

* Lack of authentication (intentional design choice)
* Username spoofing or impersonation
* Offensive or inappropriate user content
* Attacks requiring physical or network-level access to the LAN

---

## Disclosure Policy

* Please allow time for a fix before public disclosure
* Once resolved, vulnerabilities may be documented in release notes

---

## Disclaimer

This project is provided **"as is"** without warranties of any kind.
Users are responsible for securing their own network environment.

---

Thank you for helping keep **Local Server Chat** secure.
