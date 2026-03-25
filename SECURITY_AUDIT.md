# CitadelTwin — Comprehensive Security Audit Report

**Date:** 2025-07-17  
**Scope:** Full application (491 TS/TSX files, ~82,600 LOC)  
**Stack:** React 18 + TypeScript + Vite + Supabase + Three.js  
**Methodology:** 7 parallel audit agents using OWASP Top 10, CWE/SANS, SEO best practices, XSS/injection scanning, broken authentication analysis, and production readiness review.

---

## Executive Summary

The codebase (AI-generated via Lovable/GPT Engineer) had **8 critical**, **6 high**, and **20+ medium/low** vulnerabilities. All critical and high issues have been fixed. The application now passes TypeScript type-checking and production build successfully.

---

## Fixes Applied

### CRITICAL Severity — All Fixed

| # | Vulnerability | File(s) | Fix |
|---|--------------|---------|-----|
| C1 | **SQL Injection via exec-sql** — Edge function accepted arbitrary raw SQL from clients with service role key | `supabase/functions/exec-sql/index.ts` | Complete rewrite: JWT auth verification, table allowlist, parameterized Supabase client operations |
| C2 | **SQL Injection in client hooks** — 5 hooks constructed raw SQL by string-interpolating user input | `useLineItems.ts`, `useCostEstimationCore.ts`, `useCostDatabase.ts`, `useTakeoffOperations.ts`, `useQuantityTakeoff.ts` | Rewritten to use Supabase JS client API (`.from().select().eq()` etc.) — zero raw SQL |
| C3 | **XSS via dangerouslySetInnerHTML** — Blueprint3DViewer rendered unsanitized AI HTML response | `Blueprint3DViewer.tsx` | Added `sanitizeHtml()` that strips `<script>`, `<iframe>`, event handlers, `javascript:` URIs |
| C4 | **XSS via Google Maps InfoWindows** — 4 InfoWindow templates interpolated GeoJSON properties into raw HTML | `GoogleMapsGIS.tsx` | Added `escapeHtml()` utility; all 4 InfoWindow content blocks now escape external data |
| C5 | **Open Redirect** — Login page redirected to unvalidated `returnTo` query parameter | `LoginPage.tsx` | Validated: must start with `/`, must not start with `//`, must not contain `://` |
| C6 | **Admin Self-Registration** — Signup form had "Admin" in the role dropdown | `SignupPage.tsx` | Removed "Admin" option, replaced with "Viewer" |
| C7 | **No Auth in Edge Functions** — exec-sql ran with service role key, no JWT verification | `exec-sql/index.ts` | Added `supabase.auth.getUser()` check; rejects unauthenticated requests |
| C8 | **Third-party dev script in production** — `cdn.gpteng.co/gptengineer.js` loaded on every page | `index.html` | Removed entirely |

### HIGH Severity — All Fixed

| # | Vulnerability | File(s) | Fix |
|---|--------------|---------|-----|
| H1 | **Weak password policy** — 6-char minimum, no complexity requirements | `SignupPage.tsx`, `ResetPasswordPage.tsx` | Now requires 8+ chars, uppercase, lowercase, and digit |
| H2 | **Navigate-as-button bug** — `<Navigate>` inside button caused immediate redirect | `ProtectedRoute.tsx` | Changed to `<Link>` component |
| H3 | **Missing .gitignore for secrets** — `.env` files could be committed | `.gitignore` | Added `.env`, `.env.local`, `.env.production`, `.env.staging` |
| H4 | **No Content Security Policy** — No CSP header existed | `index.html` | Added `<meta http-equiv="Content-Security-Policy">` with strict directives |
| H5 | **API key logging** — Edge functions logged Gemini API key characters to console | `gemini-ai/index.ts`, `gemini-connection-test/index.ts`, `plan2scene-processor/index.ts` | Replaced with safe non-revealing messages |
| H6 | **Auth token in console** — AuthPage logged password recovery detection | `AuthPage.tsx` | Removed `console.log` statement; improved hash parsing with `URLSearchParams` |

### SEO Fixes

| Issue | Fix |
|-------|-----|
| Title was "twin-city-nexus" | Changed to "CitadelTwin — Digital Twin for Construction" |
| Description was "Lovable Generated Project" | Changed to proper product description |
| OG image pointed to lovable.dev | Removed (set your own before launch) |
| twitter:site was @lovable_dev | Removed |
| Author was "Lovable" | Changed to "CitadelTwin" |

---

## Known Issues — Not Yet Fixed

### Requires Deployment Configuration

| Issue | Severity | Notes |
|-------|----------|-------|
| CORS `Access-Control-Allow-Origin: *` in 22 edge functions | Medium | Replace `*` with actual app origin(s) before production |
| Hardcoded Supabase URL & anon key in `client.ts` | Low | These are public keys by design (Row Level Security enforces access). Move to env vars if desired. |
| Public storage buckets | Medium | Review bucket policies in Supabase dashboard |
| Client-side-only role enforcement | Medium | Add RLS policies that check `auth.jwt() ->> 'role'` on the database side |

### Code Quality (Non-Security)

| Issue | Count | Notes |
|-------|-------|-------|
| `key={index}` anti-pattern | 79 instances in ~40 files | Low risk — display-only lists, no reordering |
| Zero test coverage | 0% | Fundamental gap — add unit/integration tests |
| TypeScript strict mode disabled | — | Enable `strict: true` in tsconfig for better type safety |
| Large bundle chunks (>500KB) | 4 chunks | Use code splitting / dynamic imports |

---

## Architecture Assessment

| Dimension | Before | After | Notes |
|-----------|--------|-------|-------|
| Security | 4/10 | **7/10** | Critical/high issues fixed |
| Production Readiness | 3/10 | **5/10** | CSP, auth, injection, SEO fixes applied |
| Structure & Architecture | 3/10 | 3/10 | 491 files, many oversized |
| Code Quality | 3/10 | 3/10 | AI-generated, inconsistent patterns |
| Test Coverage | 0/10 | 0/10 | No tests exist |
| Fragility & Reliability | 3/10 | 3/10 | Heavy reliance on happy path |
| Dead Code & Bloat | 2/10 | 2/10 | Many unused components |

---

## Files Modified (19 files)

```
index.html                                          — CSP, SEO, dev script removal
.gitignore                                          — Added .env patterns
src/components/auth/LoginPage.tsx                   — Open redirect fix
src/components/auth/SignupPage.tsx                   — Admin role removal, password policy
src/components/auth/ResetPasswordPage.tsx            — Password policy
src/components/ProtectedRoute.tsx                   — Navigate → Link fix
src/components/blueprint3d/Blueprint3DViewer.tsx     — XSS sanitization
src/components/gis/GoogleMapsGIS.tsx                — InfoWindow XSS escaping
src/pages/AuthPage.tsx                              — Hash parsing, console.log removal
src/hooks/cost-estimation/useLineItems.ts           — Raw SQL → Supabase client API
src/hooks/cost-estimation/useCostEstimationCore.ts  — Raw SQL → Supabase client API
src/hooks/useCostDatabase.ts                        — Raw SQL → Supabase client API
src/hooks/quantity-takeoff/useTakeoffOperations.ts  — Raw SQL → Supabase client API
src/hooks/useQuantityTakeoff.ts                     — Raw SQL → Supabase client API
supabase/functions/exec-sql/index.ts                — Complete rewrite (auth + parameterized)
supabase/functions/gemini-ai/index.ts               — API key logging removed
supabase/functions/gemini-connection-test/index.ts  — API key logging removed
supabase/functions/plan2scene-processor/index.ts    — Key length logging removed
```

---

## Recommendations for Next Steps

1. **Add RLS policies** — Enforce authorization at the database level, not just client-side
2. **Add tests** — Start with auth flows, cost estimation CRUD, and edge function integration tests
3. **Enable TypeScript strict mode** — Catches null/undefined bugs
4. **Restrict CORS origins** — Replace `*` with your domain in all 22 edge functions
5. **Add rate limiting** — Supabase edge functions have no rate limits configured
6. **Run `npm audit`** — Check for known vulnerabilities in dependencies
7. **Set up CI/CD security scanning** — GitHub Dependabot, CodeQL, or Snyk
