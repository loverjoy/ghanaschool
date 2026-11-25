# System Audit Report — Ghana School Management System (GSMS)

**Audit Date:** 2026-11-25  
**System Version:** `1.0.0` (`package.json`)  
**Workspace:** `d:\Project\antigravity_opencode\Ghana_school`  
**Git Status:** No `.git` repository detected (`git` binary not available in sandbox PATH). No user files were modified or destroyed during baseline discovery.

## Executive Summary
The Ghana School Management System (GSMS) is a brownfield full-stack TypeScript web application consisting of a React 18 + Vite + Tailwind CSS frontend (`src/`) and an Express 5 REST API backend (`server.ts`) backed by a local JSON file database (`school_data.json`).

## Baseline Health
- **Frontend Stack:** React 18.2, React Router 6.22, Tailwind CSS 3.4, Lucide React 0.344, jsPDF 2.5.1, Vite 5.1, TypeScript 5.2.
- **Backend Stack:** Express 5.2, CORS 2.8, `tsx` runtime (dev), `esbuild` bundle to `dist/server.cjs` (prod).
- **Database:** Flat-file JSON store (`school_data.json`) with 12 top-level collections (`schools`, `users`, `students`, `teachers`, `subjects`, `assessments`, `notices`, `leaveRequests`, `timetables`, `feeTypes`, `feePayments`, `attendance`).
- **Automated Tests:** None currently exist in the repository.
- **Build Pipeline:** `npm run build` (`tsc && vite build && esbuild server.ts --bundle --platform=node --outfile=dist/server.cjs --format=cjs`).

## Key Findings & Risks
1. **Multi-Tenancy Enforcement:** All tenant API routes rely on the `X-School-Name` HTTP header enforced by middleware in `server.ts`. New endpoints must remain behind this middleware.
2. **Data Persistence & Schema Evolution:** `loadDb()` parses `school_data.json` directly without schema normalization. Adding a new collection (`questionBank`) requires defensive fallback initialization (`Array.isArray(data.questionBank) ? data.questionBank : []`) so older JSON files never crash.
3. **Existing Data Integrity:** `school_data.json` contains live/user-modified records (e.g., extra `MATHS` subject, 4 additional `assessments`, 1 additional `leaveRequest`, and modified homeroom class for `TCH0001`). Existing records MUST NOT be overwritten or reset.
4. **Security Observations (Pre-existing, out of scope for refactor):** Passwords are stored in plaintext in `school_data.json`, and role enforcement on backend routes relies on client-supplied headers (`X-User-Role`, `X-User-Email`, `X-School-Name`) without signed session tokens. New endpoints will follow existing conventions while enforcing input validation and tenant isolation.
