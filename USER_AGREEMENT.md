# User Agreement — Ghana School Management System (GSMS)

**Version:** 1.0 — **Date:** Wed Nov 25 2026

This User Agreement ("Agreement") applies to users of the Ghana School Management System ("GSMS") operated for schools. By signing in to the System, you accept this Agreement.

## 1. Acceptance of the Agreement

- To use the System you must check the sign-in form's "I agree to the User Agreement and Privacy Policy" box (see [Login page](../src/pages/Login.tsx)).
- The School may update this Agreement from time to time; a new version and date are published with it.

## 2. Who may use the System

The System is intended for authorized school staff. Access is granted by role:

- **Superadministrator** — representative of the Ministry of Education (national body).
- **School Administrator (Headmaster/Principal)** — the school manager.
- **Teacher (Tutor)** — staff of the school.

All other roles may view only what their role allows.

## 3. Account and Access

- Sign in with a username and password via `POST /api/auth/login`.
- You are responsible for keeping your credentials secure and for not sharing them.
- Access is scoped per school (sandboxed): a school administrator can manage the records of their school; a teacher sees their own teacher records only.

## 4. Acceptable Use

- Use the System only for the school operations it supports: student enrollment and profiles, assessments, attendance, fees/payments, leave requests, timetables, notices, staff directory and bulk promotion.
- Do not use the System to access another school's records, tamper with other people's accounts, or use it for purposes outside school administration.
- The System is provided for school use only.

## 5. Data Ownership

- Student, staff and operational data are owned by the school and managed through this System under this Agreement.
- The System stores data in the local database file `school_data.json` and may synchronize it to cloud backup nodes via the Push Cloud Sync endpoint (see the [Privacy Policy](PRIVACY_POLICY.md)).

## 6. Termination

The School or its administrator may suspend or delete accounts, students, teachers or other records as permitted by the System's management tools.

## 7. No warranties implied

The System is provided for school operations; the school and the System operator do not imply warranties beyond what is expressly stated.

## 8. Contact

Questions about this Agreement should be directed to the school administrator operating the System (or the Superadministrator for national-level use).
