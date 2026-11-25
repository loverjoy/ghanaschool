# Current Architecture — GSMS

## High-Level Topology
```text
Browser (React 18 + Tailwind CSS + React Router)
   │  apiFetch() injects X-School-Name, X-User-Email, X-User-Role
   ▼
Vite Dev Proxy (:5173 -> :3000) / Express Static Server (:3000)
   │
   ▼
Express 5 REST API (server.ts)
   ├── Global routes: /api/data, /api/auth/login, /api/school-register, /api/factory-reset, /api/firebase/*
   ├── Multi-tenancy middleware (requires X-School-Name)
   └── Tenant CRUD routes (subjects, students, teachers, assessments, leave, timetables, fees, attendance, notices)
   │
   ▼
JSON File Store (school_data.json) + In-Memory Mock Firestore Backup
```

## Frontend Architecture (`src/`)
- **Entry & Routing:** `src/main.tsx` -> `src/App.tsx` with `AuthProvider` and `ProtectedRoute` role guards (`superadmin`, `admin`, `teacher`).
- **Layout:** `src/components/DashboardLayout.tsx` provides desktop sidebar, mobile drawer, dark/light theme toggle (`gsms_theme`), and school header.
- **State & Data Access:** Custom hooks in `src/hooks/` (`useSchool`, `useClassLevels`, `useStudents`, `useTeachers`, `useAssessments`, `useAttendance`, `useTimetable`, `usePayments`, `useLeave`) wrap `apiFetch` (`src/apiFetch.ts`).
- **Types:** Centralized domain interfaces in `src/types.ts` (including backward-compatibility snake_case fields).

## Backend Architecture (`server.ts`)
- Single-file Express 5 server listening on `0.0.0.0:3000`.
- Synchronous file I/O (`fs.readFileSync` / `fs.writeFileSync`) via `loadDb()` / `saveDb()`.
- Production mode serves compiled Vite assets from `dist/` with SPA fallback.
