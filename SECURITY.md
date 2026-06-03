# Security Policy

## Supported Versions

Security fixes target the current `main` branch and latest public release. Older prototypes and archived snapshots are not supported unless the same issue is present in current code.

## Reporting a Vulnerability

Please do not put exploit details, credentials, API keys, customer data, printer data, or private design files in a public issue.

Report security concerns through GitHub Security Advisories or email `security@kyanitelabs.tech` with:

- affected surface: `caedo-api`, `caedo-web`, `modules/3d-designer`, scripts, or docs;
- impact and reproduction steps;
- whether any secret, design file, job data, or personal data was exposed;
- relevant OS, Python, Node, or browser version.

Expected response: acknowledgement within 3 business days, triage within 7 business days, and a fix or mitigation plan based on severity.

## Project Security Notes

Print-OS is designed as local-first maker and print-farm software. Treat API keys, `.env` files, printer/job records, private designs, and generated reports as local/private unless you explicitly publish them.

Before a release, run:

```bash
bash scripts/smoke-test.sh
cd caedo-web && npm audit --audit-level=high
cd ../modules/3d-designer && npm audit --audit-level=high
cd ../..
gitleaks dir . --no-banner --redact
```

