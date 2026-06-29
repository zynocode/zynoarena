# 🔒 Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (latest) | ✅ Active support |
| < 1.0 | ❌ Not supported |

## 🛡️ Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in OpenBoard Arcade, **please do NOT open a public GitHub issue**.

### How to Report

1. **Email**: Open a [private security advisory](https://github.com/zynocode/openboard-arcade/security/advisories/new) on GitHub (recommended)
2. **Or**: Contact us via [GitHub Discussions](https://github.com/zynocode/openboard-arcade/discussions)

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

### What to Expect

- **Acknowledgement**: Within 48 hours
- **Assessment**: Within 7 days
- **Fix timeline**: Depends on severity — critical issues within 14 days
- **Credit**: We'll credit you in the release notes (unless you prefer anonymity)

## 🔐 Scope

Since OpenBoard Arcade is a **client-side only browser game** with no backend, server, or user data storage, the attack surface is limited. Key areas of concern:

- XSS vulnerabilities in the game UI
- Supply chain attacks via npm dependencies
- Malicious code injection via contributions

## ✅ Out of Scope

- Issues in third-party dependencies (report to them directly)
- Self-XSS
- Theoretical attacks without practical impact

---

Thank you for helping keep OpenBoard Arcade safe! 🙏
