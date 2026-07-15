---
name: security-findings
description: Confirmed security gaps found during code reviews — updated after 2026-06-05 セキュリティ強化 commit
metadata:
  type: project
---

# Security Findings — Updated 2026-06-05

## Resolved in commit 597e880 (セキュリティ強化)

### RESOLVED: HTTP Security Headers
`next.config.ts` now includes all recommended headers via `securityHeaders` array:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Content-Security-Policy: frame-ancestors 'none'`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### RESOLVED: Server Actions without admin re-verification
All admin Server Actions now call `isCurrentUserAdmin()` at the top of each action:
- `app/admin/(protected)/courses/actions.ts` — `createCourse`, `updateCourse`, `deleteCourse`
- `app/admin/(protected)/courses/[id]/videos/actions.ts` — `createVideo`, `updateVideo`, `deleteVideo`
- `app/admin/(protected)/users/actions.ts` — `setUserRole`

### RESOLVED: course_id injection in updateVideo
`updateVideo` now includes `.eq('course_id', courseId)` to prevent updating a video that belongs to a different course than specified.

### RESOLVED: course_id ownership check in video_progress actions
`markVideoCompleted` and `unmarkVideoCompleted` now verify the video belongs to the specified course before writing to `video_progress`. Prevents course_id tampering.

### RESOLVED: .or() injection in searchCourses
`likePattern()` in `lib/courses.ts` now strips `(`, `)`, `,` before building the `.or()` filter string.

## Still Open

### 0. GET /auth/callback triggers enrollment (state change on GET) — confirmed 2026-07-10
`app/auth/callback/route.ts` line 17-19: `if (enroll) { await enrollCourse(enroll) }` runs inside the GET handler. This is a state-changing side effect on a GET. It's OAuth-code-gated (needs valid `code`) so CSRF risk is limited, but it violates the "no state change on GET" rule and enrolls into an attacker-chosen course via a crafted `?enroll=<uuid>` link during the callback. Low severity (only enrolls the victim into a free course) but flagged by CLAUDE.md's checklist. Same pattern also acceptable in login/signup pages because those are the user's own navigation.

### 1. deleteVideo missing .eq('course_id', courseId) — STILL OPEN, confirmed 2026-07-10
`app/admin/(protected)/courses/[id]/videos/actions.ts` line 103:
`supabase.from('videos').delete().eq('id', videoIdResult.data)` — does NOT include `.eq('course_id', courseIdResult.data)`.
`updateVideo` got the fix but `deleteVideo` did not. A crafted call with a valid videoId for a different course can still delete that video (admin-only operation, so risk is low but the fix is simple).

### 2. CSRF on state-changing endpoints
`Origin`/`Sec-Fetch-Site` verification not implemented for admin actions. CLAUDE.md flags this.

### 3. SECURITY DEFINER function grants
`admin_*`/`is_admin`/`handle_new_user` — `REVOKE EXECUTE FROM PUBLIC` not verifiable from code. Needs actual DB check.

### 4. Rate limiting absent
No IP/user-level rate limiting on search, login flow, or admin mutations.

### 5. /search page missing noindex
`/search` and result pages lack `robots: { index: false }`.

### 6. OGP images not set
`openGraph`/`twitter` images missing.

### 7. XML sitemap not created
`app/sitemap.ts` does not exist.

**How to apply:** When reviewing new code that touches admin actions, always check for server-side admin re-verification AND that DELETE/UPDATE queries include ownership constraints (course_id, user_id) alongside the primary ID. When reviewing `next.config.ts` changes, verify headers remain present.
