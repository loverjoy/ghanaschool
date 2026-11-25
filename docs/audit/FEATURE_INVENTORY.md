# Feature Inventory — GSMS

| Module | Route | Allowed Roles | Backend Endpoints | Status |
|---|---|---|---|---|
| Authentication | `/login` | Public | `POST /api/auth/login` | Active |
| MoE Control Hub | `/superadmin` | `superadmin` | `POST /api/school-register`, `/api/data` | Active |
| Overview Dashboard | `/dashboard` | `admin`, `teacher` | `/api/data`, `/api/notices`, `/api/leave-requests` | Active |
| Students Roster | `/students` | `admin`, `teacher` | `POST /api/students`, `PUT /api/students/:id` | Active |
| Staff & Faculty | `/staff` | `admin`, `teacher` | `POST/PUT/DELETE /api/teachers` | Active |
| Class & Curriculum | `/curriculum` | `admin` | `GET/POST /api/curriculum-subjects`, `POST/PUT/DELETE /api/subjects` | Active |
| Weekly Attendance | `/attendance` | `admin`, `teacher` | `GET/POST /api/attendance` | Active |
| Attendance Stats | `/attendance-analytics` | `admin`, `teacher` | `/api/data` | Active |
| Assessment Ledger | `/assessments` | `admin`, `teacher` | `POST/DELETE /api/assessments` | Active |
| Bulk Promotion | `/promotions` | `admin` | `PUT /api/students/:id` | Active |
| Academic Timetables | `/timetable` | `admin`, `teacher` | `GET/POST/DELETE /api/timetables` | Active |
| Alumni Directory | `/alumni` | `admin`, `teacher` | `/api/data` | Active |
| Tuition Fees | `/payments` | `admin` | `GET/POST /api/fee-payments`, `GET/POST /api/fee-types` | Active |
| Leave Requests | `/leave` | `admin`, `teacher` | `POST/PUT /api/leave-requests` | Active |
| Settings & Cloud Sync | `/settings` | `superadmin`, `admin`, `teacher` | `PUT /api/school-update`, `/api/firebase/*`, `/api/factory-reset` | Active |
| **Question Bank** | `/question-bank` | `admin`, `teacher` | `GET/POST/PUT/DELETE /api/question-bank` | Active |
