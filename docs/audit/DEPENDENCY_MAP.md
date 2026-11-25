# Dependency Map — GSMS

## Runtime Dependencies (`package.json`)
- `react` (^18.2.0), `react-dom` (^18.2.0): UI library.
- `react-router-dom` (^6.22.3): Client-side routing and `ProtectedRoute` guards.
- `lucide-react` (^0.344.0): Icon library used across sidebar and pages.
- `jspdf` (^2.5.1): Client-side PDF generation (reusable for Question Bank exam paper & marking scheme PDF export — no new dependencies required).
- `express` (^5.2.1), `cors` (^2.8.6): Backend HTTP API server.
- `tsx` (^4.22.4), `concurrently` (^10.0.3): Development execution.

## Dev Dependencies
- `typescript` (^5.2.2), `vite` (^5.1.6), `@vitejs/plugin-react` (^4.2.1)
- `tailwindcss` (^3.4.1), `postcss` (^8.4.35), `autoprefixer` (^10.4.18)

## Internal Module Dependencies for Question Bank
- `src/pages/QuestionBankPage.tsx` -> `useAuth`, `useSchool`, `useClassLevels`, `useQuestionBank`, `jspdf`, `lucide-react`
- `src/hooks/useQuestionBank.ts` -> `apiFetch`, `QuestionBankItem` (`src/types.ts`)
- `src/App.tsx` -> `QuestionBankPage`
- `src/components/DashboardLayout.tsx` -> `/question-bank` sidebar link
- `server.ts` -> `school_data.json` (`questionBank` collection)
