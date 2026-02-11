# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email the maintainer with details of the vulnerability
3. Allow time for the issue to be addressed before public disclosure

## Secrets and API Keys

**IMPORTANT**: Never commit secrets, API keys, or tokens to the repository.

### Protected Information

- IFPA API keys
- Match Play API tokens
- Any personal API credentials
- Environment variables containing sensitive data

### Best Practices

1. Always use `.env.local` for local development (gitignored by default)
2. Use `.env.example` as a template (with placeholder values only)
3. Never hardcode credentials in source code
4. Use environment variables for all sensitive configuration
5. Review commits before pushing to ensure no secrets are included

### GitHub Actions

- Secrets should be stored in GitHub Secrets
- Never log or expose secrets in CI output
- Use `test_key_for_build` placeholder values in CI

## Dependency Security

- Dependencies are monitored for vulnerabilities
- Run `npm audit` regularly to check for issues
- Keep dependencies up to date

## Supported Versions

Security updates will be provided for:

- Current major version (latest)
- Previous major version (for 30 days after new major release)

## Scope

This project is intended for personal use and learning. While we take security seriously, this is not a production-critical application.

---

Last updated: February 2026
