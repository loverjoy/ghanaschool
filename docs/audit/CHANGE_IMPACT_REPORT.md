# Change Impact Report & Implementation Plan — Question Bank Page

## Phase 4: Task Classification
- **Type:** Perfective Maintenance (New Feature Enhancement)
- **Priority:** Medium / Routine Enhancement
- **Requested Change:** Add a Question Bank page to the Ghana School Management System following `masteragent_existing.md`.

## Phase 5: Change Impact & Risk Analysis
### Affected Files
| File | Action | Risk |
|---|---|---|
| `server.ts` | Add `questionBank` fallback in `loadDb()`, seed items in `SEED_DATA`, and tenant-scoped `GET/POST/PUT/DELETE /api/question-bank` endpoints | Low (additive) |
| `school_data.json` | Add `questionBank` array with sample Ghana curriculum items while preserving 100% of existing collections | Low (non-destructive) |
| `src/types.ts` | Add `QuestionType`, `QuestionDifficulty`, `QuestionBankItem` types | Low (additive) |
| `src/hooks/useQuestionBank.ts` | Create new hook for CRUD operations against `/api/question-bank` | Low (new file) |
| `src/pages/QuestionBankPage.tsx` | Create Question Bank UI (search/filters, create/edit/delete, answer key toggle, exam paper selection & PDF export) | Low (new file) |
| `src/App.tsx` | Register `/question-bank` route for `['admin', 'teacher']` | Low (additive) |
| `src/components/DashboardLayout.tsx` | Add `Question Bank` link to sidebar navigation for `['admin', 'teacher']` | Low (additive) |

### Compatibility & Security Assessment
- **API Compatibility:** Zero breaking changes to existing endpoints. `/api/data` and `/api/firebase/*` remain backward compatible.
- **Database Impact:** Non-destructive. `loadDb()` defaults missing `questionBank` to `[]`.
- **Security:** Enforces `X-School-Name` tenant isolation on all `/api/question-bank` endpoints; validates required fields, question types, difficulty levels, marks (`> 0`), and MCQ option requirements server-side; prevents cross-school reads/writes/deletes.
- **Dependencies:** Zero new npm packages required (reuses `lucide-react` and `jspdf`).

### Acceptance Criteria
1. `admin` and `teacher` users can navigate to `/question-bank` from the sidebar; `superadmin` receives Access Denied on `/question-bank`.
2. Users can view, search, and filter questions by Subject, Class Level, Term, Question Type, and Difficulty.
3. Users can create, edit, and delete questions with form and server-side validation.
4. Changes persist to `school_data.json` and remain isolated per school (`X-School-Name`).
5. Teachers/Admins can toggle Answer Keys/Marking Schemes and select questions to export a formatted Exam Paper PDF and Marking Scheme PDF via `jsPDF`.
6. Existing pages, routes, and `school_data.json` records remain completely intact.
7. `npm run build` succeeds with zero TypeScript or bundler errors.

### Rollback Procedure
- Remove `/question-bank` route from `src/App.tsx` and sidebar link from `src/components/DashboardLayout.tsx`.
- Delete `src/pages/QuestionBankPage.tsx` and `src/hooks/useQuestionBank.ts`.
- Revert `server.ts` `/api/question-bank` routes and `src/types.ts` additions; remove the `questionBank` key from `school_data.json` (all other collections remain untouched).
