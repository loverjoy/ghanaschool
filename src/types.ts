export type ClassLevel =
  | "KG1"
  | "KG2"
  | "Primary 1"
  | "Primary 2"
  | "Primary 3"
  | "Primary 4"
  | "Primary 5"
  | "Primary 6"
  | "JHS 1"
  | "JHS 2"
  | "JHS 3"
  | "Graduated";

export type Stream = string;

export type StudentStatus = "Active" | "Graduated" | "Transferred" | "Withdrawn" | "Repeated";

export interface CsspsChoice {
  schoolName: string;
  category: "Category A" | "Category B" | "Category C" | "Category D";
  program: string;
}

export interface Student {
  studentId: string;       // STU[Year][4-digit-seq], e.g. STU20260001
  name: string;
  dateOfBirth: string;
  gender: string;
  classLevel: ClassLevel;
  stream: Stream;
  parentName: string;
  parentContact: string;
  status: StudentStatus;   // "Active" | "Graduated" | "Transferred" | "Withdrawn"
  enrolledAt: string;
  schoolName?: string;
  photoUrl?: string;       // base64 image encoding
  csspsChoices?: CsspsChoice[]; // Exactly 8 Senior High choices for tracking placements

  // Backward Compatibility Fields for Old UI Pages
  id: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  class_level_id: string;
  stream_id?: string | null;
  ghana_id: string;
  medical_info?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at?: string;
  school_id?: string;
}

export interface ClassAssignment {
  classLevel: ClassLevel;
  stream: Stream;
  subjectCode: string;
}

export interface Teacher {
  teacherId: string;       // TCH[4-digit-seq], e.g. TCH0001
  name: string;
  subject: string;         // Core subject field
  phone: string;
  email: string;
  qualification: string;
  classAssignments: ClassAssignment[];
  registrationCode?: string;
  authorizedByAdmin?: boolean;
  schoolName?: string;
  isClassTeacher?: boolean;
  homeroomClass?: {
    classLevel: ClassLevel;
    stream: Stream;
  };
}

export interface Subject {
  code: string;            // e.g. "MTH", "ENG", "BDG"
  name: string;            // e.g. "Mathematics", "English", "Basic Design & Technology"
  applicableLevels: ClassLevel[];
  schoolName?: string;

  // Backward Compatibility
  id: string;
  school_id?: string;
  class_level_id?: string;
}

export interface Assessment {
  id: string;              // unique assessment ID
  studentId: string;
  subjectCode: string;
  term: "Term 1" | "Term 2" | "Term 3";
  year: number;
  classScore: number;      // Validated 0-100
  examScore: number;       // Validated 0-100
  schoolName?: string;

  // Backward Compatibility
  student_id: string;
  subject_id: string;
  class_level_id: string;
  academic_year: string;
  class_score: number;
  exam_score: number;
  average_score: number;
  recorded_by?: string;
  teacher_signature_date?: string | null;
}

export interface School {
  id: string;
  name: string;
  code: string;
  region: string;
  multiStreamMode: boolean;
  passMark: number;
  createdAt: string;

  // Backward Compatibility
  multi_stream_mode?: boolean;
  pass_mark?: number;
  created_at?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "teacher";
  name: string;
  schoolName: string | null;
  designation: string;

  // Backward Compatibility
  school_id: string | null;

  // Teacher Specific Mappings
  isClassTeacher?: boolean;
  homeroomClass?: {
    classLevel: ClassLevel;
    stream: Stream;
  };
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  schoolName?: string;
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy: string | null;
  createdAt: string;
  schoolName?: string;

  // Backward Compatibility
  school_id?: string;
  teacher_id?: string;
  start_date?: string;
  end_date?: string;
  approved_by?: string | null;
  created_at?: string;
}

export interface TimetablePeriod {
  id: string;
  classLevel: ClassLevel;
  stream: Stream;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectCode: string;
  teacherId: string;
  isBreak: boolean;
  schoolName?: string;

  // Backward Compatibility
  school_id?: string;
  class_level_id?: string;
  stream_id?: string | null;
  start_time?: string;
  end_time?: string;
  subject_id?: string;
  teacher_id?: string;
  is_break?: boolean;
}

export interface FeeType {
  id: string;
  name: string;
  amount: number;
  schoolName?: string;

  // Backward Compatibility
  school_id?: string;
}

export interface FeePayment {
  id: string;
  studentId: string;
  feeTypeId: string;
  amountPaid: number;
  paymentDate: string;
  receiptNumber: string;
  term: string;
  year: number;
  collectorId: string;
  schoolName?: string;

  // Backward Compatibility
  school_id?: string;
  student_id?: string;
  fee_type_id?: string;
  amount_paid?: number;
  payment_date?: string;
  receipt_number?: string;
  academic_year?: string;
}

export interface Attendance {
  id: string; // studentId_date composite key
  studentId: string;
  date: string; // YYYY-MM-DD
  status: "Present" | "Absent" | "Late" | "Excused";
  comment: string;
  term: string;
  year: number;
  schoolName?: string;

  // Backward Compatibility
  school_id?: string;
  student_id?: string;
  academic_year?: string;
}

export type QuestionType = "MCQ" | "Short Answer" | "Essay" | "True/False";

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export interface QuestionBankItem {
  id: string;
  subjectCode: string;
  classLevel: ClassLevel;
  term: "Term 1" | "Term 2" | "Term 3";
  topic: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  schoolName?: string;
}
