# Technical Debt Register — GSMS

1. **No Automated Test Suite:** Neither unit tests nor API integration tests exist in `package.json`. Regression verification requires manual or scripted build + HTTP checks.
2. **Plaintext Passwords & Header-Based Auth:** `users` in `school_data.json` store plaintext passwords and API authorization trusts client-sent `X-School-Name` / `X-User-Role` headers without JWT/session verification.
3. **Full-DB Fetching on Client Hooks:** Several hooks fetch `/api/data` (entire database) and filter client-side. New Question Bank hook will use dedicated scoped endpoints (`GET /api/question-bank`) for cleaner performance and isolation.
4. **Synchronous File I/O (`fs.writeFileSync`):** `saveDb()` writes the entire JSON file synchronously on every mutation; concurrent writes could race under load.
5. **Backward-Compatibility Field Duplication:** `src/types.ts` mixes camelCase and snake_case fields from an earlier Supabase migration (`src/lib/supabase.ts` appears legacy).
6. **Unversioned Workspace:** No `.git` repository is initialized in the workspace.
