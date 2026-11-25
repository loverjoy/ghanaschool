import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DB_PATH = path.resolve('school_data.json');

// Authentication / Authorization guards for sensitive operations (Master Agent doc).
// apiFetch() injects X-User-Email / X-User-Role from the logged-in session.
function guard(roles?: string[]) {
  return (req: any, res: any, next: any) => {
    const email = req.headers['x-user-email'];
    if (!email) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    if (roles && !roles.includes(req.headers['x-user-role'] as string)) {
      return res.status(403).json({ error: 'Insufficient authorization for this operation.' });
    }
    next();
  };
}

// Helper to load database
function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.questionBank)) {
        parsed.questionBank = [];
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read school_data.json:', err);
  }
  return {
    schools: [],
    users: [],
    students: [],
    teachers: [],
    subjects: [],
    assessments: [],
    notices: [],
    leaveRequests: [],
    timetables: [],
    feeTypes: [],
    feePayments: [],
    attendance: [],
    questionBank: []
  };
}

// Helper to save database (atomic: write temp file, then rename)
function saveDb(data: any) {
  const tmpPath = `${DB_PATH}.tmp`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    console.error('Failed to write school_data.json:', err);
  }
}

// Seed helper for factory-reset
const SEED_DATA = {
  schools: [
    {
      id: "sch-01",
      name: "Accra High School",
      code: "AHS01",
      region: "Greater Accra",
      multiStreamMode: true,
      passMark: 50,
      createdAt: "2025-01-15T08:00:00Z"
    },
    {
      id: "sch-02",
      name: "Kumasi Academy",
      code: "KAC02",
      region: "Ashanti",
      multiStreamMode: false,
      passMark: 55,
      createdAt: "2025-02-10T09:00:00Z"
    }
  ],
  users: [
    { id: "u-super", username: "superadmin", email: "superadmin@moe.gov.gh", password: "password", role: "superadmin", name: "Efua Mensah", schoolName: null, designation: "MoE Coordinator" },
    { id: "u-accra-admin", username: "kofi.appiah", email: "kofi.appiah@accrahigh.edu.gh", password: "password", role: "admin", name: "Kofi Appiah", schoolName: "Accra High School", designation: "Headmaster" },
    { id: "u-kumasi-admin", username: "kwame.owusu", email: "kwame.owusu@kumasi.edu.gh", password: "password", role: "admin", name: "Kwame Owusu", schoolName: "Kumasi Academy", designation: "Principal" },
    { id: "u-ama", username: "ama.serwaa", email: "ama.serwaa@accrahigh.edu.gh", password: "password", role: "teacher", name: "Ama Serwaa", schoolName: "Accra High School", designation: "Tutor" },
    { id: "u-kwame", username: "kwame.boateng", email: "kwame.boateng@accrahigh.edu.gh", password: "password", role: "teacher", name: "Kwame Boateng", schoolName: "Accra High School", designation: "Science Tutor" }
  ],
  students: [
    {
      studentId: "STU20260001",
      name: "Yao Osei",
      dateOfBirth: "2013-05-14",
      gender: "Male",
      classLevel: "JHS 1",
      stream: "A",
      parentName: "Isaac Osei",
      parentContact: "+233 24 123 4567",
      status: "Active",
      enrolledAt: "2025-09-01T08:00:00Z",
      schoolName: "Accra High School",
      photoUrl: "",
      csspsChoices: [
        { schoolName: "Achimota School", category: "Category A", program: "General Science" },
        { schoolName: "Prempeh College", category: "Category A", program: "General Science" },
        { schoolName: "Accra Academy", category: "Category B", program: "General Arts" },
        { schoolName: "St. Thomas Aquinas", category: "Category B", program: "General Arts" },
        { schoolName: "Presby Boys SHS", category: "Category A", program: "General Science" },
        { schoolName: "Adisadel College", category: "Category A", program: "General Science" },
        { schoolName: "Giffard SHS", category: "Category C", program: "Home Economics" },
        { schoolName: "Odorgonno SHS", category: "Category C", program: "Visual Arts" }
      ]
    },
    {
      studentId: "STU20260002",
      name: "Adwoa Mensah",
      dateOfBirth: "2013-08-22",
      gender: "Female",
      classLevel: "JHS 1",
      stream: "A",
      parentName: "Efua Mensah",
      parentContact: "+233 20 987 6543",
      status: "Active",
      enrolledAt: "2025-09-01T08:00:00Z",
      schoolName: "Accra High School",
      photoUrl: "",
      csspsChoices: []
    },
    {
      studentId: "STU20260003",
      name: "Kwabena Owusu",
      dateOfBirth: "2013-02-10",
      gender: "Male",
      classLevel: "JHS 1",
      stream: "B",
      parentName: "Mary Owusu",
      parentContact: "+233 55 456 7890",
      status: "Active",
      enrolledAt: "2025-09-01T08:00:00Z",
      schoolName: "Accra High School",
      photoUrl: "",
      csspsChoices: []
    }
  ],
  teachers: [
    {
      teacherId: "TCH0001",
      name: "Ama Serwaa",
      subject: "Mathematics",
      phone: "+233 24 000 0001",
      email: "ama.serwaa@accrahigh.edu.gh",
      qualification: "B.Ed Mathematics",
      classAssignments: [
        { classLevel: "JHS 1", stream: "A", subjectCode: "MTH" }
      ],
      registrationCode: "REG-AMA-123",
      authorizedByAdmin: true,
      schoolName: "Accra High School",
      isClassTeacher: true,
      homeroomClass: { classLevel: "JHS 1", stream: "A" }
    },
    {
      teacherId: "TCH0002",
      name: "Kwame Boateng",
      subject: "Integrated Science",
      phone: "+233 24 000 0002",
      email: "kwame.boateng@accrahigh.edu.gh",
      qualification: "B.Sc Physics",
      classAssignments: [
        { classLevel: "JHS 1", stream: "A", subjectCode: "SCI" },
        { classLevel: "JHS 1", stream: "B", subjectCode: "SCI" }
      ],
      registrationCode: "REG-KWA-456",
      authorizedByAdmin: true,
      schoolName: "Accra High School",
      isClassTeacher: false
    }
  ],
  subjects: [
    { code: "MTH", name: "Mathematics", applicableLevels: ["KG1", "KG2", "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3"], schoolName: "Accra High School" },
    { code: "SCI", name: "Integrated Science", applicableLevels: ["Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3"], schoolName: "Accra High School" },
    { code: "ENG", name: "English Language", applicableLevels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3"], schoolName: "Accra High School" },
    { code: "GHA", name: "Ghanaian Language", applicableLevels: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3"], schoolName: "Accra High School" }
  ],
  assessments: [
    { id: "asm-01", studentId: "STU20260001", subjectCode: "MTH", term: "Term 1", year: 2026, classScore: 80, examScore: 90, schoolName: "Accra High School" },
    { id: "asm-02", studentId: "STU20260002", subjectCode: "MTH", term: "Term 1", year: 2026, classScore: 65, examScore: 75, schoolName: "Accra High School" },
    { id: "asm-03", studentId: "STU20260003", subjectCode: "MTH", term: "Term 1", year: 2026, classScore: 40, examScore: 50, schoolName: "Accra High School" }
  ],
  notices: [
    { id: "not-1", title: "Staff Meeting", content: "End of term staff meeting scheduled for Friday at 2:00 PM.", date: "2026-06-15", schoolName: "Accra High School" },
    { id: "not-2", title: "PTA Levy Due", content: "Please remind parents that PTA Levies should be paid before next Monday.", date: "2026-06-16", schoolName: "Accra High School" }
  ],
  leaveRequests: [
    { id: "leave-1", teacherId: "TCH0002", startDate: "2026-06-20", endDate: "2026-06-25", reason: "Medical Checkup in Kumasi", status: "Pending", approvedBy: null, createdAt: "2026-06-15T09:00:00Z", schoolName: "Accra High School" }
  ],
  timetables: [
    { id: "tp-01", classLevel: "JHS 1", stream: "A", day: "Monday", startTime: "08:00", endTime: "09:00", subjectCode: "MTH", teacherId: "TCH0001", isBreak: false, schoolName: "Accra High School" },
    { id: "tp-02", classLevel: "JHS 1", stream: "A", day: "Monday", startTime: "09:00", endTime: "10:00", subjectCode: "SCI", teacherId: "TCH0002", isBreak: false, schoolName: "Accra High School" },
    { id: "tp-03", classLevel: "JHS 1", stream: "A", day: "Monday", startTime: "10:00", endTime: "10:30", subjectCode: "", teacherId: "", isBreak: true, schoolName: "Accra High School" }
  ],
  feeTypes: [
    { id: "ft-tui", name: "Tuition Fee", amount: 1200, schoolName: "Accra High School" },
    { id: "ft-pta", name: "PTA Levy", amount: 150, schoolName: "Accra High School" },
    { id: "ft-exam", name: "Exam Fee", amount: 100, schoolName: "Accra High School" }
  ],
  feePayments: [
    { id: "pay-01", studentId: "STU20260001", feeTypeId: "ft-tui", amountPaid: 1200, paymentDate: "2026-06-01", receiptNumber: "REC-100201", term: "Term 1", year: 2026, collectorId: "u-accra-admin", schoolName: "Accra High School" },
    { id: "pay-02", studentId: "STU20260002", feeTypeId: "ft-tui", amountPaid: 600, paymentDate: "2026-06-02", receiptNumber: "REC-100202", term: "Term 1", year: 2026, collectorId: "u-accra-admin", schoolName: "Accra High School" }
  ],
  attendance: [
    { id: "STU20260001_2026-06-15", studentId: "STU20260001", date: "2026-06-15", status: "Present", comment: "", term: "Term 1", year: 2026, schoolName: "Accra High School" },
    { "id": "STU20260002_2026-06-15", studentId: "STU20260002", date: "2026-06-15", status: "Absent", comment: "Malaria fever", term: "Term 1", year: 2026, schoolName: "Accra High School" }
  ],
  questionBank: [
    {
      id: "qb-seed-01",
      subjectCode: "MTH",
      classLevel: "JHS 1",
      term: "Term 1",
      topic: "Linear Equations",
      questionType: "MCQ",
      difficulty: "Easy",
      marks: 2,
      questionText: "Solve for x in the equation 3x + 7 = 22.",
      options: ["x = 3", "x = 5", "x = 7", "x = 15"],
      correctAnswer: "x = 5",
      explanation: "Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5.",
      createdBy: "u-ama",
      createdByName: "Ama Serwaa",
      createdAt: "2026-06-10T09:00:00Z",
      schoolName: "Accra High School"
    },
    {
      id: "qb-seed-02",
      subjectCode: "SCI",
      classLevel: "JHS 1",
      term: "Term 1",
      topic: "Photosynthesis & Plant Nutrition",
      questionType: "Short Answer",
      difficulty: "Medium",
      marks: 4,
      questionText: "State two raw materials required for photosynthesis and name the green pigment that traps sunlight.",
      options: [],
      correctAnswer: "Raw materials: Carbon dioxide (CO2) and Water (H2O). Green pigment: Chlorophyll.",
      explanation: "Award 1 mark for each raw material and 2 marks for correctly naming chlorophyll.",
      createdBy: "u-kwame",
      createdByName: "Kwame Boateng",
      createdAt: "2026-06-11T10:30:00Z",
      schoolName: "Accra High School"
    },
    {
      id: "qb-seed-03",
      subjectCode: "ENG",
      classLevel: "JHS 1",
      term: "Term 2",
      topic: "Parts of Speech",
      questionType: "MCQ",
      difficulty: "Easy",
      marks: 1,
      questionText: "Identify the adverb in the sentence: 'The students answered the BECE mock questions carefully.'",
      options: ["students", "answered", "mock", "carefully"],
      correctAnswer: "carefully",
      explanation: "'Carefully' modifies the verb 'answered' by describing how the action was performed.",
      createdBy: "u-accra-admin",
      createdByName: "Kofi Appiah",
      createdAt: "2026-06-12T11:15:00Z",
      schoolName: "Accra High School"
    },
    {
      id: "qb-seed-04",
      subjectCode: "SCI",
      classLevel: "JHS 2",
      term: "Term 1",
      topic: "States of Matter",
      questionType: "True/False",
      difficulty: "Easy",
      marks: 1,
      questionText: "Sublimation is the direct change of a substance from the solid state to the gaseous state without passing through the liquid state.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Examples include camphor, iodine crystals, and dry ice (solid CO2).",
      createdBy: "u-kwame",
      createdByName: "Kwame Boateng",
      createdAt: "2026-06-13T08:45:00Z",
      schoolName: "Accra High School"
    },
    {
      id: "qb-seed-05",
      subjectCode: "MTH",
      classLevel: "JHS 3",
      term: "Term 3",
      topic: "Mensuration & Geometry",
      questionType: "Essay",
      difficulty: "Hard",
      marks: 10,
      questionText: "A cylindrical water tank in Accra has a radius of 1.4 m and a height of 3.0 m. Taking pi = 22/7, calculate: (a) the curved surface area of the tank, and (b) the volume of water it can hold in litres.",
      options: [],
      correctAnswer: "(a) Curved Surface Area = 2 * (22/7) * 1.4 * 3.0 = 26.4 m^2. (b) Volume = (22/7) * 1.4^2 * 3.0 = 18.48 m^3 = 18,480 litres.",
      explanation: "Award 4 marks for part (a), 4 marks for volume in m^3, and 2 marks for converting m^3 to litres (1 m^3 = 1000 litres).",
      createdBy: "u-ama",
      createdByName: "Ama Serwaa",
      createdAt: "2026-06-14T14:20:00Z",
      schoolName: "Accra High School"
    }
  ]
};

// Global Cloud Backup Storage Mock
let mockCloudFirestore: Record<string, any> = {};

// Port Binding & Sandbox Constraint
const PORT = 3000;

// REST Endpoints
app.get('/api/data', (req, res) => {
  const userEmail = req.headers['x-user-email'] as string;
  const userRole = req.headers['x-user-role'] as string;

  const data = loadDb();

  if (userRole === 'teacher' && userEmail) {
    // Sanitize other teachers' records
    data.teachers = data.teachers.map((t: any) => {
      if (t.email && t.email.toLowerCase() === userEmail.toLowerCase()) {
        return t;
      }
      return {
        teacherId: t.teacherId,
        name: t.name,
        schoolName: t.schoolName
      };
    });

    // Restrict other teacher user records
    data.users = data.users.filter((u: any) => 
      u.role !== 'teacher' || (u.email && u.email.toLowerCase() === userEmail.toLowerCase())
    );
  }

  res.json(data);
});

// Authentication Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = loadDb();
  
  if (username === 'superadmin' && password === 'password') {
    const superUser = db.users.find((u: any) => u.role === 'superadmin') || {
      id: "u-super",
      username: "superadmin",
      email: "superadmin@moe.gov.gh",
      role: "superadmin",
      name: "Efua Mensah",
      schoolName: null
    };
    return res.json({ success: true, user: superUser });
  }

  // Find user by username or email
  const user = db.users.find((u: any) => 
    (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && 
    u.password === password
  );

  if (user) {
    let responseUser = { ...user };
    if (user.role === 'teacher') {
      const teacherRecord = db.teachers.find((t: any) => t.email.toLowerCase() === user.email.toLowerCase());
      if (teacherRecord) {
        responseUser = {
          ...responseUser,
          isClassTeacher: !!teacherRecord.isClassTeacher,
          homeroomClass: teacherRecord.homeroomClass || null
        };
      }
    }
    return res.json({ success: true, user: responseUser });
  }

  res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
});

// Multi-Tenancy Sandbox Header Checker
app.use((req, res, next) => {
  // Pass-through for non-API frontend/static routes and global API operations
  if (
    !req.path.startsWith('/api/') ||
    req.path.startsWith('/api/data') ||
    req.path.startsWith('/api/auth/login') ||
    req.path.startsWith('/api/school-register') ||
    req.path.startsWith('/api/factory-reset') ||
    req.path.startsWith('/api/firebase')
  ) {
    return next();
  }

  const schoolName = req.headers['x-school-name'] as string;
  if (!schoolName) {
    return res.status(400).json({ error: 'Missing sandboxing X-School-Name header.' });
  }
  next();
});

// 4.1 Global Operations
app.post('/api/school-register', guard(['superadmin']), (req, res) => {
  const newSchool = req.body;
  const db = loadDb();

  const id = `sch-${Date.now()}`;
  const schoolRecord = {
    id,
    name: newSchool.name,
    code: newSchool.code,
    region: newSchool.region,
    multiStreamMode: !!newSchool.multiStreamMode,
    passMark: Number(newSchool.passMark || 50),
    createdAt: new Date().toISOString()
  };

  db.schools.push(schoolRecord);

  // Auto-generate admin user for this school
  const adminUsername = newSchool.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.admin';
  const adminEmail = `admin@${newSchool.code.toLowerCase()}.edu.gh`;
  const adminUser = {
    id: `u-${Date.now()}-adm`,
    username: adminUsername,
    email: adminEmail,
    password: 'password',
    role: 'admin',
    name: `${newSchool.name} Admin`,
    schoolName: newSchool.name,
    designation: 'Headmaster'
  };

  db.users.push(adminUser);
  saveDb(db);

  res.json({ success: true, school: schoolRecord, adminUser });
});

app.put('/api/school-update', guard(['admin', 'superadmin']), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const updates = req.body;
  const db = loadDb();

  const index = db.schools.findIndex((s: any) => s.name === schoolName);
  if (index !== -1) {
    db.schools[index] = { ...db.schools[index], ...updates };
    saveDb(db);
    return res.json({ success: true, school: db.schools[index] });
  }
  res.status(404).json({ error: 'School profile not found.' });
});

app.post('/api/factory-reset', guard(['superadmin']), (req, res) => {
  saveDb(SEED_DATA);
  res.json({ success: true, message: 'Database reset to initial template.' });
});

// 4.2 Local Curriculum & Subjects Registry
app.get('/api/curriculum-subjects', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  const schoolSubjects = db.subjects.filter((s: any) => s.schoolName === schoolName);
  res.json(schoolSubjects);
});

app.post('/api/curriculum-subjects', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const subjectsList = req.body; // Array of subjects
  const db = loadDb();

  // Filter out existing and update
  db.subjects = db.subjects.filter((s: any) => s.schoolName !== schoolName);
  const updatedSubjects = subjectsList.map((s: any) => ({
    ...s,
    schoolName
  }));
  db.subjects.push(...updatedSubjects);
  saveDb(db);
  res.json({ success: true, count: updatedSubjects.length });
});

app.post('/api/subjects', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const subject = req.body;
  const db = loadDb();

  const record = { ...subject, schoolName };
  db.subjects.push(record);
  saveDb(db);
  res.json({ success: true, subject: record });
});

app.put('/api/subjects/:code', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const code = req.params.code;
  const updates = req.body;
  const db = loadDb();

  const idx = db.subjects.findIndex((s: any) => s.schoolName === schoolName && s.code === code);
  if (idx !== -1) {
    db.subjects[idx] = { ...db.subjects[idx], ...updates };
    saveDb(db);
    return res.json({ success: true, subject: db.subjects[idx] });
  }
  res.status(404).json({ error: 'Subject not found.' });
});

app.delete('/api/subjects/:code', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const code = req.params.code;
  const db = loadDb();

  db.subjects = db.subjects.filter((s: any) => !(s.schoolName === schoolName && s.code === code));
  saveDb(db);
  res.json({ success: true });
});

// 4.3 Student & Teacher Registrations
app.post('/api/students', guard(['admin', 'superadmin']), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const student = req.body;
  const db = loadDb();

  // Validate studentId format STU[Year][4-digit-seq]
  const currentYear = new Date().getFullYear();
  const schoolStudents = db.students.filter((s: any) => s.schoolName === schoolName);
  const seq = String(schoolStudents.length + 1).padStart(4, '0');
  const studentId = student.studentId || `STU${currentYear}${seq}`;

  const record = {
    ...student,
    studentId,
    schoolName,
    csspsChoices: student.csspsChoices || [],
    status: student.status || 'Active',
    enrolledAt: student.enrolledAt || new Date().toISOString()
  };

  db.students.push(record);
  saveDb(db);
  res.json({ success: true, student: record });
});

app.put('/api/students/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const studentId = req.params.id;
  const updates = req.body;
  const db = loadDb();

  const idx = db.students.findIndex((s: any) => s.schoolName === schoolName && s.studentId === studentId);
  if (idx !== -1) {
    db.students[idx] = { ...db.students[idx], ...updates };
    saveDb(db);
    return res.json({ success: true, student: db.students[idx] });
  }
  res.status(404).json({ error: 'Student not found.' });
});

// Teacher endpoints
app.post('/api/teachers', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const teacher = req.body;
  const db = loadDb();

  const seq = String(db.teachers.length + 1).padStart(4, '0');
  const teacherId = teacher.teacherId || `TCH${seq}`;

  const record = {
    ...teacher,
    teacherId,
    schoolName,
    authorizedByAdmin: teacher.authorizedByAdmin ?? true
  };

  db.teachers.push(record);

  // Auto-generate a login account for this teacher
  const teacherUsername = teacher.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.tch';
  const teacherUser = {
    id: `u-${Date.now()}-tch`,
    username: teacherUsername,
    email: teacher.email,
    password: 'password',
    role: 'teacher',
    name: teacher.name,
    schoolName: schoolName,
    designation: 'Tutor'
  };
  db.users.push(teacherUser);

  saveDb(db);
  res.json({ success: true, teacher: record, teacherUser });
});

app.put('/api/teachers/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const teacherId = req.params.id;
  const updates = req.body;
  const db = loadDb();

  const idx = db.teachers.findIndex((t: any) => t.schoolName === schoolName && t.teacherId === teacherId);
  if (idx !== -1) {
    db.teachers[idx] = { ...db.teachers[idx], ...updates };
    
    // Also sync teacher name/email to user profiles
    const userIdx = db.users.findIndex((u: any) => u.schoolName === schoolName && u.email === db.teachers[idx].email);
    if (userIdx !== -1) {
      db.users[userIdx].name = db.teachers[idx].name;
      db.users[userIdx].email = db.teachers[idx].email;
    }

    saveDb(db);
    return res.json({ success: true, teacher: db.teachers[idx] });
  }
  res.status(404).json({ error: 'Teacher not found.' });
});

app.delete('/api/teachers/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const teacherId = req.params.id;
  const db = loadDb();

  const teacher = db.teachers.find((t: any) => t.schoolName === schoolName && t.teacherId === teacherId);
  if (teacher) {
    db.users = db.users.filter((u: any) => !(u.schoolName === schoolName && u.email === teacher.email));
  }

  db.teachers = db.teachers.filter((t: any) => !(t.schoolName === schoolName && t.teacherId === teacherId));
  saveDb(db);
  res.json({ success: true });
});

// 4.4 Scores, Assessments & Continuous Grading
app.post('/api/assessments', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const assessment = req.body;
  const db = loadDb();

  // Strict Validation Rules: 0 <= classScore <= 100 AND 0 <= examScore <= 100
  const cScore = Number(assessment.classScore);
  const eScore = Number(assessment.examScore);

  if (isNaN(cScore) || cScore < 0 || cScore > 100) {
    return res.status(400).json({ error: 'Invalid classScore: must be in range [0 - 100].' });
  }
  if (isNaN(eScore) || eScore < 0 || eScore > 100) {
    return res.status(400).json({ error: 'Invalid examScore: must be in range [0 - 100].' });
  }

  const record = {
    ...assessment,
    id: assessment.id || `asm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    classScore: cScore,
    examScore: eScore,
    schoolName
  };

  const idx = db.assessments.findIndex((a: any) => a.id === record.id);
  if (idx !== -1) {
    db.assessments[idx] = record;
  } else {
    db.assessments.push(record);
  }

  saveDb(db);
  res.json({ success: true, assessment: record });
});

app.delete('/api/assessments/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const db = loadDb();

  db.assessments = db.assessments.filter((a: any) => !(a.schoolName === schoolName && a.id === id));
  saveDb(db);
  res.json({ success: true });
});

// Leave requests
app.post('/api/leave-requests', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const request = req.body;
  const db = loadDb();

  const record = {
    ...request,
    id: request.id || `leave-${Date.now()}`,
    status: request.status || 'Pending',
    createdAt: new Date().toISOString(),
    schoolName
  };
  db.leaveRequests.push(record);
  saveDb(db);
  res.json({ success: true, leaveRequest: record });
});

app.put('/api/leave-requests/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const updates = req.body;
  const db = loadDb();

  const idx = db.leaveRequests.findIndex((l: any) => l.schoolName === schoolName && l.id === id);
  if (idx !== -1) {
    db.leaveRequests[idx] = { ...db.leaveRequests[idx], ...updates };
    saveDb(db);
    return res.json({ success: true, leaveRequest: db.leaveRequests[idx] });
  }
  res.status(404).json({ error: 'Leave request not found.' });
});

// Timetable Scheduler
app.get('/api/timetables', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  res.json(db.timetables.filter((t: any) => t.schoolName === schoolName));
});

app.post('/api/timetables', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const period = req.body;
  const db = loadDb();

  const record = {
    ...period,
    id: period.id || `tp-${Date.now()}`,
    schoolName
  };
  db.timetables.push(record);
  saveDb(db);
  res.json({ success: true, period: record });
});

app.delete('/api/timetables/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const db = loadDb();

  db.timetables = db.timetables.filter((t: any) => !(t.schoolName === schoolName && t.id === id));
  saveDb(db);
  res.json({ success: true });
});

// Finance & Fees Endpoints
app.get('/api/fee-payments', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  res.json(db.feePayments.filter((f: any) => f.schoolName === schoolName));
});

app.post('/api/fee-payments', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const payment = req.body;
  const db = loadDb();

  const record = {
    ...payment,
    id: payment.id || `pay-${Date.now()}`,
    receiptNumber: payment.receiptNumber || `REC-${Math.floor(100000 + Math.random() * 900000)}`,
    schoolName
  };
  db.feePayments.push(record);
  saveDb(db);
  res.json({ success: true, feePayment: record });
});

app.get('/api/fee-types', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  res.json(db.feeTypes.filter((f: any) => f.schoolName === schoolName));
});

app.post('/api/fee-types', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const type = req.body;
  const db = loadDb();

  const record = {
    ...type,
    id: type.id || `ft-${Date.now()}`,
    schoolName
  };
  db.feeTypes.push(record);
  saveDb(db);
  res.json({ success: true, feeType: record });
});

// Attendance Endpoints
app.get('/api/attendance', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  res.json(db.attendance.filter((a: any) => a.schoolName === schoolName));
});

app.post('/api/attendance', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const list = req.body; // Array of attendance records
  const db = loadDb();

  list.forEach((item: any) => {
    const id = `${item.studentId}_${item.date}`;
    const record = {
      ...item,
      id,
      schoolName
    };
    const idx = db.attendance.findIndex((a: any) => a.id === id && a.schoolName === schoolName);
    if (idx !== -1) {
      db.attendance[idx] = record;
    } else {
      db.attendance.push(record);
    }
  });

  saveDb(db);
  res.json({ success: true, count: list.length });
});

// Notices Endpoints
app.get('/api/notices', (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const db = loadDb();
  res.json(db.notices.filter((n: any) => n.schoolName === schoolName));
});

app.post('/api/notices', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const notice = req.body;
  const db = loadDb();

  const record = {
    ...notice,
    id: notice.id || `not-${Date.now()}`,
    date: notice.date || new Date().toISOString().split('T')[0],
    schoolName
  };
  db.notices.push(record);
  saveDb(db);
  res.json({ success: true, notice: record });
});

app.delete('/api/notices/:id', guard(), (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const db = loadDb();

  db.notices = db.notices.filter((n: any) => !(n.schoolName === schoolName && n.id === id));
  saveDb(db);
  res.json({ success: true });
});

// Question Bank Endpoints (Tenant-scoped via X-School-Name + role-restricted to admin/teacher)
const VALID_QUESTION_TYPES = ['MCQ', 'Short Answer', 'Essay', 'True/False'];
const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const VALID_TERMS = ['Term 1', 'Term 2', 'Term 3'];

function requireQuestionBankRole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = String(req.headers['x-user-role'] || '').toLowerCase();
  if (role !== 'admin' && role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied. Only school admins and teachers may access the Question Bank.' });
  }
  next();
}

function validateQuestionPayload(payload: any): { valid: boolean; error?: string; normalized?: any } {
  const questionText = typeof payload.questionText === 'string' ? payload.questionText.trim() : '';
  const subjectCode = typeof payload.subjectCode === 'string' ? payload.subjectCode.trim() : '';
  const classLevel = typeof payload.classLevel === 'string' ? payload.classLevel.trim() : '';
  const term = typeof payload.term === 'string' && payload.term.trim() ? payload.term.trim() : 'Term 1';
  const topic = typeof payload.topic === 'string' ? payload.topic.trim() : '';
  const questionType = typeof payload.questionType === 'string' ? payload.questionType.trim() : '';
  const difficulty = typeof payload.difficulty === 'string' ? payload.difficulty.trim() : '';
  const marks = Number(payload.marks);
  const correctAnswer = typeof payload.correctAnswer === 'string' ? payload.correctAnswer.trim() : '';
  const explanation = typeof payload.explanation === 'string' ? payload.explanation.trim() : '';

  if (!questionText) return { valid: false, error: 'Question text is required.' };
  if (!subjectCode) return { valid: false, error: 'Subject code is required.' };
  if (!classLevel) return { valid: false, error: 'Class level is required.' };
  if (!VALID_TERMS.includes(term)) return { valid: false, error: 'Invalid term. Must be Term 1, Term 2, or Term 3.' };
  if (!VALID_QUESTION_TYPES.includes(questionType)) {
    return { valid: false, error: `Invalid questionType. Must be one of: ${VALID_QUESTION_TYPES.join(', ')}.` };
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return { valid: false, error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}.` };
  }
  if (!Number.isFinite(marks) || marks < 1 || marks > 100) {
    return { valid: false, error: 'Marks must be a number between 1 and 100.' };
  }
  if (!correctAnswer) return { valid: false, error: 'Correct answer / marking scheme is required.' };

  let options: string[] = [];
  if (questionType === 'MCQ') {
    options = Array.isArray(payload.options)
      ? payload.options.map((o: any) => String(o ?? '').trim()).filter(Boolean)
      : [];
    if (options.length < 2) {
      return { valid: false, error: 'MCQ questions require at least 2 non-empty options.' };
    }
    if (!options.includes(correctAnswer)) {
      return { valid: false, error: 'For MCQ questions, correctAnswer must match one of the provided options.' };
    }
  } else if (questionType === 'True/False') {
    options = ['True', 'False'];
    if (correctAnswer !== 'True' && correctAnswer !== 'False') {
      return { valid: false, error: 'For True/False questions, correctAnswer must be "True" or "False".' };
    }
  }

  return {
    valid: true,
    normalized: {
      subjectCode,
      classLevel,
      term,
      topic,
      questionType,
      difficulty,
      marks,
      questionText,
      options,
      correctAnswer,
      explanation
    }
  };
}

app.get('/api/question-bank', requireQuestionBankRole, (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const { subjectCode, classLevel, term, difficulty, questionType, search } = req.query;
  const db = loadDb();

  let items = (db.questionBank || []).filter((q: any) => q.schoolName === schoolName);

  if (subjectCode && typeof subjectCode === 'string') {
    items = items.filter((q: any) => q.subjectCode === subjectCode);
  }
  if (classLevel && typeof classLevel === 'string') {
    items = items.filter((q: any) => q.classLevel === classLevel);
  }
  if (term && typeof term === 'string') {
    items = items.filter((q: any) => q.term === term);
  }
  if (difficulty && typeof difficulty === 'string') {
    items = items.filter((q: any) => q.difficulty === difficulty);
  }
  if (questionType && typeof questionType === 'string') {
    items = items.filter((q: any) => q.questionType === questionType);
  }
  if (search && typeof search === 'string' && search.trim()) {
    const qLower = search.trim().toLowerCase();
    items = items.filter((q: any) =>
      (q.questionText && q.questionText.toLowerCase().includes(qLower)) ||
      (q.topic && q.topic.toLowerCase().includes(qLower)) ||
      (q.subjectCode && q.subjectCode.toLowerCase().includes(qLower)) ||
      (q.correctAnswer && q.correctAnswer.toLowerCase().includes(qLower))
    );
  }

  items.sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  res.json(items);
});

app.post('/api/question-bank', requireQuestionBankRole, (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const validation = validateQuestionPayload(req.body || {});
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const db = loadDb();
  const record = {
    id: `qb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...validation.normalized,
    createdBy: req.body.createdBy || req.headers['x-user-email'] || 'unknown',
    createdByName: req.body.createdByName || 'Staff Member',
    createdAt: new Date().toISOString(),
    schoolName
  };

  db.questionBank.push(record);
  saveDb(db);
  res.status(201).json({ success: true, question: record });
});

app.put('/api/question-bank/:id', requireQuestionBankRole, (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const db = loadDb();

  const idx = (db.questionBank || []).findIndex((q: any) => q.schoolName === schoolName && q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  const existing = db.questionBank[idx];
  const merged = { ...existing, ...req.body };
  const validation = validateQuestionPayload(merged);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const updated = {
    ...existing,
    ...validation.normalized,
    id: existing.id,
    schoolName: existing.schoolName,
    createdAt: existing.createdAt,
    createdBy: existing.createdBy,
    createdByName: existing.createdByName,
    updatedAt: new Date().toISOString()
  };

  db.questionBank[idx] = updated;
  saveDb(db);
  res.json({ success: true, question: updated });
});

app.delete('/api/question-bank/:id', requireQuestionBankRole, (req, res) => {
  const schoolName = req.headers['x-school-name'] as string;
  const id = req.params.id;
  const db = loadDb();

  const idx = (db.questionBank || []).findIndex((q: any) => q.schoolName === schoolName && q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  db.questionBank.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// 4.5 Cloud Synchronization Layer & Firestore Image Chunking Strategy
// Chunking limits: 700KB per document.
const CHUNK_SIZE = 700 * 1024; // 700 KB

app.get('/api/firebase/status', (req, res) => {
  // Mock Firebase connection status
  res.json({ success: true, connected: true, latencyMs: 42, activeBackupNodes: Object.keys(mockCloudFirestore).length });
});

app.post('/api/firebase/push', (req, res) => {
  const localData = loadDb();
  
  // Slicing strategy for large files: scan all students for large photoUrl base64 strings
  const studentsToPush = localData.students.map((student: any) => {
    if (student.photoUrl && student.photoUrl.length > CHUNK_SIZE) {
      const base64Str = student.photoUrl;
      const totalBytes = Buffer.byteLength(base64Str, 'utf8');
      const numChunks = Math.ceil(totalBytes / CHUNK_SIZE);
      
      const chunks: string[] = [];
      for (let i = 0; i < numChunks; i++) {
        chunks.push(base64Str.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
      }

      // Store chunks in mock Firestore
      const chunkRef = `chunk_meta_${student.studentId}`;
      mockCloudFirestore[chunkRef] = { numChunks };
      chunks.forEach((chunk, index) => {
        mockCloudFirestore[`${chunkRef}_chunk_${index}`] = chunk;
      });

      console.log(`[Backup Image Chunking] Student ${student.studentId} photoUrl of size ${totalBytes} bytes split into ${numChunks} chunks.`);
      
      // Leave student record with referenced metadata instead of full base64 on cloud backup
      return {
        ...student,
        photoUrl: `[CHUNKED_REF]:${chunkRef}`
      };
    }
    return student;
  });

  // Backup the rest of the database
  const cloudPayload = {
    ...localData,
    students: studentsToPush
  };

  mockCloudFirestore['main_database_backup'] = cloudPayload;
  
  res.json({
    success: true,
    message: 'Local database state packaged, sliced, and successfully synchronized to Firestore cloud backup nodes.',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/firebase/pull', (req, res) => {
  if (!mockCloudFirestore['main_database_backup']) {
    return res.status(404).json({ error: 'No cloud backups found.' });
  }

  const cloudPayload = JSON.parse(JSON.stringify(mockCloudFirestore['main_database_backup']));
  
  // Restore chunked pictures
  cloudPayload.students = cloudPayload.students.map((student: any) => {
    if (student.photoUrl && student.photoUrl.startsWith('[CHUNKED_REF]:')) {
      const chunkRef = student.photoUrl.replace('[CHUNKED_REF]:', '');
      const meta = mockCloudFirestore[chunkRef];
      if (meta && meta.numChunks) {
        let reconstructedBase64 = '';
        for (let i = 0; i < meta.numChunks; i++) {
          reconstructedBase64 += mockCloudFirestore[`${chunkRef}_chunk_${i}`] || '';
        }
        console.log(`[Restore Image Reconstitution] Reconstructed student ${student.studentId} photoUrl from ${meta.numChunks} chunks.`);
        return {
          ...student,
          photoUrl: reconstructedBase64
        };
      }
    }
    return student;
  });

  saveDb(cloudPayload);

  res.json({
    success: true,
    message: 'Cloud database state pulled, reconstructed from Firestore, and local database file updated.',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build static assets in production
const prodDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const distDir = fs.existsSync(path.join(prodDirname, 'index.html'))
  ? prodDirname
  : fs.existsSync(path.join(prodDirname, 'dist', 'index.html'))
    ? path.join(prodDirname, 'dist')
    : path.resolve('dist');

if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.use((req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Server on host 0.0.0.0 and port 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express server running at http://0.0.0.0:${PORT}`);
});
