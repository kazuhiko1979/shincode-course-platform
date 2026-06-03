---
name: project-architecture
description: Core architectural decisions, file conventions, and patterns confirmed in the shincode-course-platform codebase
metadata:
  type: project
---

# Project Architecture — shincode-course-platform

## Confirmed Conventions (as of 2026-06-03 initial review)

### Auth pattern
- `getClaims()` used everywhere (not `getSession()`) — correct
- `getRequestClaims()` in `lib/auth.ts` wraps `getClaims()` with React `cache()` for per-request dedup
- `isAdminById()` in `lib/auth.ts` is the single source of truth for admin checks
- Admin layout (`app/admin/(protected)/layout.tsx`) double-checks: JWT claims + `isCurrentUserAdmin()` DB query
- Middleware (`proxy.ts` → `lib/supabase/middleware.ts`) does the first gate

### Caching pattern
- Public data functions use `'use cache'` + `cacheLife` + `cacheTag` with `createPublicClient()` (cookie-free)
- Server Actions use `updateTag()` (not `revalidateTag()`) for cache invalidation — this is the Next.js 16 convention
- Runtime-auth data is always inside `<Suspense>` boundaries (Header AuthButton, EnrollSection)

### Supabase clients
- `lib/supabase/server.ts` — for Server Components and Server Actions (reads cookies)
- `lib/supabase/client.ts` — for `'use client'` components
- `lib/supabase/public.ts` — cookie-free, for `'use cache'` blocks only
- `lib/supabase/middleware.ts` — for the proxy middleware

### Security pattern
- All Server Action inputs validated with Zod from `lib/schemas.ts`
- UUIDs: `uuidSchema.safeParse()` before DB queries
- Roles: `roleSchema.safeParse()` before role changes
- Open redirect: `safeRedirectPath()` in `lib/auth.ts`
- Admin DB operations: SECURITY DEFINER RPC (`admin_list_users`, `admin_set_role`, `admin_stats`, `is_admin`)

### Proxy pattern
- `proxy.ts` at project root (renamed from `middleware.ts` in Next.js 16)
- Routes protected: `/mypage/:path*`, `/admin/:path*`

### Component placement
- `'use client'` pushed to leaf nodes (EnrollButton, MarkCompleteButton, DeleteCourseButton, etc.)
- Server Components fetch data, pass serializable props to Client Components
- Admin-specific UI in `components/admin/`

**Why:** These are the foundational decisions from the first commit. Future reviewers should verify new code adheres to these patterns before approving.
