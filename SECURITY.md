# Security Policy

## Supported Versions

This project is in active v1 development. Only the `main` branch receives security fixes.

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |
| Older   | No        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security problems.**

Email security reports to **jordanmaulana26@gmail.com** with:

- A clear description of the issue and its impact.
- Steps to reproduce (proof-of-concept code if applicable).
- Affected component: backend (`api/`, `core/`), frontend (`frontend/`), or mobile (`mobile/`).
- Your name/handle if you want credit in the fix changelog.

You'll receive an acknowledgement within 5 business days. I aim to ship a fix or mitigation within 90 days of confirmation; coordinated disclosure after the fix is preferred.

## Scope

**In scope**
- Tenant-isolation bypass (one admin reading another's data).
- Authentication/authorization flaws on `/api/v1/*` endpoints.
- Injection (SQL, command, template).
- Sensitive data exposure in responses, logs, or static bundles.
- Vulnerabilities in the Mayar webhook handler (`api/v1/payments_api.py`).
- Server-rendered admin pages under `core/views.py`.

**Out of scope**
- Issues in third-party services (Mayar, Google OAuth provider).
- Demo seed data (`create_demo` command — clearly marked dev-only).
- Self-XSS, missing best-practice headers without demonstrated impact, social engineering.
- Denial of service via volumetric traffic.

## Hall of Fame

Reporters who follow this policy will be credited here after a fix ships, unless they prefer to remain anonymous.
