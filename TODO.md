# My Pinball Stats — TODO

> Living task list. Items are grouped by priority. Check off as completed.

---

## 🔴 Priority 1 — Branding & Launch

- [x] **1.1** Rename the app to "My Pinball Stats" everywhere (package.json, layout.tsx title/meta, page.tsx header, README, repo name, etc.)
- [x] **1.2** Rename the GitHub repository from `Pinball-Dash` → `MyPinballStats` (or similar)
- [x] **1.3** Update the page header/title in the UI to "My Pinball Stats" (remove profanity from title & heading)
- [x] **1.4** Connect the repository to the Vercel account for automated deployments
- [x] **1.5** Point the custom domain `www.mypinballstats.com` to Vercel (DNS config + Vercel domain settings)

---

## 🟠 Priority 2 — New Features (User-Requested)

- [ ] **2.1** Create a connection/provider for the Stern Insider Connected (SternIC) API
- [ ] **2.2** Add a SternIC stats & badges section to the dashboard
- [ ] **2.3** Build a multi-user architecture — allow any player to enter their own Match Play #, IFPA #, and SternIC ID
- [ ] **2.4** Persist player IDs across visits (login system, or local storage + optional account)
- [ ] **2.5** Create a login/signup page (evaluate options: OAuth, email/password, magic links)
- [ ] **2.6** Ensure any PII and auth flows are secure (HTTPS-only, hashed passwords or token-based auth, encrypted storage)
- [ ] **2.7** Add backend analytics — user counts, page hits, usage stats (consider Vercel Analytics, PostHog, or Plausible)

---

## 🟡 Priority 3 — Security Fixes (from Audit)

- [ ] **3.1** Remove hardcoded default player IDs from source code — require them from user input or env
- [ ] **3.2** Add authentication to the `POST /api/refresh` cache-clear endpoint
- [ ] **3.3** Improve rate limiting — don't rely solely on spoofable `x-forwarded-for` header
- [ ] **3.4** Add input validation on player ID query params (reject negatives, zero, excessively large values)
- [ ] **3.5** Add CORS configuration in `next.config.js`
- [ ] **3.6** Add Content Security Policy (CSP) headers
- [ ] **3.7** Add CSRF protection to POST endpoints

---

## 🔵 Priority 4 — Code Quality & Architecture

- [ ] **4.1** Break up `page.tsx` (280+ lines) into separate components (`Card`, `StatRow`, `GradeBadge`, etc.) under a `components/` directory
- [ ] **4.2** Fix `useEffect` missing dependency warning for `fetchData`
- [ ] **4.3** Remove all `any` types — use proper typing throughout (`cache.ts`, `http.ts`, `ifpa.ts`)
- [ ] **4.4** Use `getEnvVar()` helper consistently (matchplay.ts currently accesses `process.env` directly)
- [ ] **4.5** Make `ApiResponse` a proper discriminated union type (`{success: true; data: T} | {success: false; error: string}`)
- [ ] **4.6** Replace inline percentage formatting with the existing `formatPercent` helper
- [ ] **4.7** Add structured logging (replace `console.error` with a proper logger like pino)
- [ ] **4.8** Add environment variable validation at startup (fail fast if keys are missing)
- [ ] **4.9** Wire up the unused `getPvpOpponentsTop10` IFPA PVP feature or remove dead code

---

## 🟢 Priority 5 — Performance

- [ ] **5.1** Convert from full client-side rendering (`'use client'`) to Server Components with streaming/Suspense
- [ ] **5.2** Add `loading.tsx` and Suspense boundaries for progressive loading
- [ ] **5.3** Replace CSS `@import` Google Fonts with `next/font/google` for non-blocking font loading
- [ ] **5.4** Replace in-memory cache with a production-ready solution (Vercel KV, Redis, or similar) — in-memory cache doesn't survive serverless cold starts
- [ ] **5.5** Add `AbortController` cleanup on component unmount to prevent state updates on unmounted components
- [ ] **5.6** Respect `prefers-reduced-motion` for the background twinkle animation
- [ ] **5.7** Proactively clean up expired cache entries (the `cleanup()` method exists but is never called)

---

## 🟣 Priority 6 — SEO, Meta & Accessibility

- [ ] **6.1** Add Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] **6.2** Add Twitter Card meta tags
- [ ] **6.3** Add a canonical URL
- [ ] **6.4** Add a `favicon.ico` (currently missing — browsers get 404)
- [ ] **6.5** Add `robots.txt` and `sitemap.xml`
- [ ] **6.6** Add accessible labels to the loading spinner (`role="status"`, `aria-label`)
- [ ] **6.7** Add `<caption>` or `aria-label` to data tables
- [ ] **6.8** Fix color contrast on muted text (`#8a8a9a` on `#1a1b24` is below WCAG AA 4.5:1)
- [ ] **6.9** Add a skip-to-content link for keyboard navigation
- [ ] **6.10** Add a web app manifest (`manifest.json`) for PWA / mobile install support

---

## ⚪ Priority 7 — Testing & CI/CD

- [ ] **7.1** Set up a test runner (Vitest or Jest)
- [ ] **7.2** Write unit tests for providers (`ifpa.ts`, `matchplay.ts`), cache, and http utilities
- [ ] **7.3** Write integration tests for API routes
- [ ] **7.4** Add a `test` script to `package.json` and a test step to CI
- [ ] **7.5** Update GitHub Actions to `actions/checkout@v4` and `actions/setup-node@v4`
- [ ] **7.6** Add Node.js 22.x to the CI test matrix
- [ ] **7.7** Add automated deployment step to CI (Vercel CLI or GitHub integration)
- [ ] **7.8** Add dependency security scanning (Dependabot, `npm audit`, or Snyk)
- [ ] **7.9** Set up Prettier and enforce consistent formatting

---

## ⚫ Priority 8 — Documentation & Cleanup

- [ ] **8.1** Update README to reflect the new "My Pinball Stats" branding
- [ ] **8.2** Fix README — remove false "Dark Mode Support" claim (CSS is dark-only, no light mode toggle)
- [ ] **8.3** Fix README API response examples to match actual `DashboardData` type fields
- [ ] **8.4** Add a `LICENSE` file (README claims MIT but no license file exists)
- [ ] **8.5** Add an email address to `SECURITY.md` for vulnerability reporting
- [ ] **8.6** Remove `pages/**` from Tailwind content config (no `pages/` directory exists)
- [ ] **8.7** Update dependencies — Next.js 14→15, React 18→19, ESLint 8→9, TypeScript 5.3→5.7+
- [ ] **8.8** Add a custom 404 page (`not-found.tsx`)
- [ ] **8.9** Add an error boundary (`error.tsx`) for graceful crash recovery

---

_Last updated: 2026-02-11_
