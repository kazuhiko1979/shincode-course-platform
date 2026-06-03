---
name: security-findings
description: Confirmed security gaps found during the 2026-06-03 initial full-codebase review — these are known open issues
metadata:
  type: project
---

# Security Findings — Initial Review (2026-06-03)

## Critical / High

### 1. HTTP Security Headers — MISSING (CLAUDE.md acknowledges this)
`next.config.ts` has no `headers()` configuration. All recommended headers are absent:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` (even `frame-ancestors 'none'` minimum)
- `Referrer-Policy`
- `Permissions-Policy`

**Status:** Listed as `⚠️` in CLAUDE.md checklist. This is the highest-priority gap before public launch.

### 2. Server Actions without admin re-verification
`app/admin/(protected)/courses/actions.ts`, `app/admin/(protected)/courses/[id]/videos/actions.ts`, and `app/admin/(protected)/users/actions.ts` do NOT call `isAdminById()` or `getClaims()` before performing DB mutations. They rely entirely on the layout-level and middleware-level guard.

This means: if someone bypasses the layout (e.g., calling the Server Action directly from a crafted client), there is no server-side admin check in the action itself. The layout guard does NOT protect direct Server Action invocations.

**Risk level:** Medium-High. Layout guards do not protect Server Actions called directly.

### 3. CSRF on logout route
`app/auth/logout/route.ts` is a POST-only route — correct. But CLAUDE.md flags that `Origin`/`Sec-Fetch-Site` header verification is not implemented. The UserMenu uses a `<form method="POST">` which is CSRF-safe for same-origin, but this should be confirmed.

### 4. Auto-enroll via GET callback parameter (enroll param)
`app/auth/callback/route.ts` reads `enroll` query param and calls `enrollCourse(enroll)`. The `enrollCourse` action validates the UUID, but the `enroll` param is passed through the OAuth callback URL which could be tampered. The UUID validation in `enrollCourse` is the only guard.

### 5. searchCourses .or() injection (low — public table)
`lib/courses.ts` `searchCourses()` escapes `%`, `_`, `\` in the ilike pattern but builds the `.or()` filter as a string. Supabase's `.or()` with a string argument could be susceptible to injection via comma/parenthesis characters. CLAUDE.md acknowledges this with "影響小" (low impact) since it's a public table.

## Known / Acknowledged Gaps (from CLAUDE.md checklist)
- SECURITY DEFINER function grants not verifiable from code (must check actual DB)
- Rate limiting absent on search, login flow
- `/search` page missing `noindex` robots meta
- OGP images not set
- XML sitemap not created
- Bundle analysis not done

**How to apply:** When reviewing new code that touches admin actions, always check for server-side admin re-verification. When reviewing `next.config.ts` changes, check if headers were added.
