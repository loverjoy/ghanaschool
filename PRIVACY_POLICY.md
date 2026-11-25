# Privacy Policy — Ghana School Management System (GSMS)

**Version:** 1.0 — **Date:** Wed Nov 25 2026

This Privacy Policy describes how the Ghana School Management System ("GSMS") collects, uses, stores and shares personal data of its users. It applies to the school hosting the System and, where relevant, the Superadministrator of the Ministry of Education.

## 1. Data Controller

- For a school's data, the **School** (its administrator) is the data controller.
- For national-level data held by the Superadministrator, the MoE representative is the data controller.

## 2. Data Collected

We collect data necessary for school operations, including:

- **Students:** student ID, name, date of birth, gender, class level, stream, parent/guardian name and contact details, Ghana National ID number, medical conditions, emergency contact details, enrollment status, profile photo, Senior High placement choices (CSSPS), and dates of attendance/leave.
- **Users/staff:** username, email, role, school name, designation, and for teachers: phone, qualification, class assignments, registration code.
- **Academic data:** assessment class/exam scores (continuous and terminal), term results, timetables, subjects and applicable class levels.
- **Finance & administration:** fee types, fee payments with receipt numbers, leave request details and approval status, notices.
- **System data:** login credentials, school settings (region, pass mark, multi-stream mode), and backup/sync status.

## 3. Legal Basis

Processing of student and staff data is necessary for the school's legitimate interest in managing the school and is based on the school's authority over students and its contractual obligations. We collect only data needed for school operations.

## 4. Storage and Location

- **Local storage:** the database is stored in `school_data.json` on the school's server or machine.
- **Cloud sync:** the school may trigger "Push Cloud Sync" (`POST /api/firebase/push`), which packages the local database and sends it to the configured cloud backup nodes; "Restore Cloud Sync" (`POST /api/firebase/pull`) pulls it back. This is an active operation initiated by the administrator, not continuous tracking.

## 5. Sharing

- Data is shared with school administrators of the relevant school (data is sandboxed per school) and with teachers in the same school as needed for their duties.
- Data is not sold, and is not shared with third parties for their own purposes.

## 6. Security

- Role-based access control; teachers see only their own teacher records and are restricted in the data the server returns for them.
- Login uses username/password authentication (`POST /api/auth/login`).
- Note (observation from system audit): credentials in the current implementation are stored in the database as provided. This policy makes no claim of password hashing; schools are advised to protect the database file and consider enabling a stronger authentication layer.

## 7. Your Rights

Subject to school policies and local regulations, requests for access, correction or deletion of your data should be made to the school administrator. The school controls deletion via the management endpoints where provided (e.g., `DELETE /api/assessments/:id`, `DELETE /api/timetables/:id`) and via student record management.

## 8. Retention

Student data is retained while the student is enrolled or for school policy periods after departure (e.g., Alumni directory). Assessment, attendance and payment records are retained for administrative purposes.

## 9. Updates

This Privacy Policy may be updated. Changes are published together with a new version and date of this policy.

## 10. Contact

Questions about this Privacy Policy should be directed to the school administrator operating the System (or the Superadministrator for national-level use).
