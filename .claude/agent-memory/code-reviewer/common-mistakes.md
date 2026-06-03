---
name: common-mistakes
description: Patterns to watch for in code reviews — mistakes that could appear in future changes to this codebase
metadata:
  type: feedback
---

# Common Mistake Patterns to Watch For

## Next.js 16 Specific

1. **Forgetting to `await params`** — `params` and `searchParams` are Promises in Next.js 16. Every page must `const { id } = await params`. This codebase does this correctly everywhere.

2. **Using `revalidateTag()` in Server Actions** — In this project, Server Actions use `updateTag()` not `revalidateTag()`. `revalidateTag` was changed to a 2-argument form and Server Actions use `updateTag` for read-your-own-writes. The codebase correctly uses `updateTag` in actions and `revalidatePath` alongside it.

3. **Using `getSession()` instead of `getClaims()`** — Never use `getSession()` on the server. Always use `getClaims()` which does JWT signature verification. The codebase correctly uses `getClaims()` everywhere.

4. **Using `cookies()` inside `'use cache'` blocks** — `'use cache'` blocks cannot access `cookies()`. Must use `createPublicClient()` from `lib/supabase/public.ts`. The codebase correctly separates this.

## Security Patterns

5. **Admin Server Actions without server-side auth check** — The biggest recurring risk. Layout guards don't protect Server Actions called directly. New admin actions should call `getClaims()` + `isAdminById()` inside the action, not just rely on layout guards.

6. **Open redirect without `safeRedirectPath()`** — Any code that reads a `next=` or redirect parameter must use `safeRedirectPath()` from `lib/auth.ts`. The codebase does this correctly in login/callback flows.

7. **UUID inputs not validated with `uuidSchema`** — Before any `.eq('id', someInput)` query, validate with `uuidSchema.safeParse()`. The codebase does this consistently.

## Component Patterns

8. **Adding `'use client'` to parent components unnecessarily** — Client boundary should be pushed to the smallest leaf component that needs interactivity. Avoid making data-fetching parent components into Client Components.

9. **Using `<a href>` instead of `<Link>`** — Always use Next.js `<Link>` for internal navigation.

10. **Runtime auth data outside `<Suspense>`** — Components that call `getRequestClaims()` or `getClaims()` must be inside `<Suspense>` boundaries when in a cached page context (like the Header's AuthButton and EnrollSection).

**Why:** Derived from initial codebase review. These are the patterns most likely to cause regressions as the codebase evolves.
**How to apply:** Check each of these on every new PR touching auth, admin actions, or caching logic.
