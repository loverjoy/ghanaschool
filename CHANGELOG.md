# Changelog

All notable changes to the Ghana School Management System (GSMS) are documented in this file.

## [1.1.0] - 2026-11-25

### Added
- **Question Bank Page (`/question-bank`):**
  - Added full-featured `QuestionBankPage` (`src/pages/QuestionBankPage.tsx`) accessible to `admin` and `teacher` roles via the sidebar navigation (`DashboardLayout.tsx`) and protected routing (`App.tsx`).
  - Added `useQuestionBank` hook (`src/hooks/useQuestionBank.ts`) and `QuestionBankItem`, `QuestionType`, `QuestionDifficulty` types (`src/types.ts`).
  - Supports searching and filtering by Subject, Class Level, Term, Question Type (`MCQ`, `Short Answer`, `Essay`, `True/False`), and Difficulty (`Easy`, `Medium`, `Hard`).
  - Supports creating, editing, and deleting questions with client-side and server-side validation.
  - Supports collapsible per-question and global Answer Key / Marking Scheme visibility.
  - Supports multi-select Exam Paper building and client-side PDF export for both **Exam Question Papers** and **Marking Schemes** using `jsPDF`.
- **Question Bank REST API (`server.ts`):**
  - Added tenant-scoped (`X-School-Name`) and role-guarded (`admin`/`teacher` via `requireQuestionBankRole`) endpoints: `GET /api/question-bank`, `POST /api/question-bank`, `PUT /api/question-bank/:id`, and `DELETE /api/question-bank/:id`.
  - Enforced server-side validation for required fields, marks bounds (`1-100`), MCQ option membership, and True/False answers.
  - Added defensive `questionBank` array initialization in `loadDb()` for backward compatibility with existing `school_data.json` files.
  - Added 5 Ghana-curriculum sample questions to `SEED_DATA` and non-destructively appended them to `school_data.json`.
- **System Audit Documentation (`docs/audit/`):**
  - Added `SYSTEM_AUDIT_REPORT.md`, `CURRENT_ARCHITECTURE.md`, `FEATURE_INVENTORY.md`, `DEPENDENCY_MAP.md`, `TECHNICAL_DEBT.md`, and `CHANGE_IMPACT_REPORT.md` per `masteragent_existing.md`.

### Fixed
- **Production SPA Serving (`server.ts`):** Scoped `X-School-Name` middleware to `/api/*` paths only and fixed `dist` directory resolution in `dist/server.cjs` so direct navigation/refresh on frontend routes such as `/question-bank` serves `index.html` cleanly instead of returning HTTP 400/404.
