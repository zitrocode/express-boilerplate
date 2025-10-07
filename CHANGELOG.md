# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-10-06

### Changed

- Limited request body size to **10KB** for both JSON and URL-encoded data to prevent potential DoS attacks.
- Enhanced security headers using **Helmet**:
  - Added **Content Security Policy (CSP)**.
  - Added **Cross-Origin Resource Policy (CORP)**.
  - Added **Cross-Origin Embedder Policy (COEP)**.
- Removed **cookie-parser** since JWT tokens are now handled via the `Authorization` header.

### Security

- Added **express-mongo-sanitize** to prevent NoSQL injection attacks.

---

## 1.0.0 (2025-10-02)

### Features

- Initial release
