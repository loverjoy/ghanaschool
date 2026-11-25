// High-fidelity Mock Supabase Client for local simulation
// Stores data in localStorage, mimicking Supabase RLS and database schemas.

export interface School {
  id: string;
  name: string;
  code: string;
  region: string;
  multi_stream_mode: boolean; // true = Pri 1A/1B, false = Pri 1
  pass_mark: number; // e.g. 50
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'superadmin' | 'admin' | 'teacher';
  name: string;
  school_id: string | null;
  designation: string;
  created_at: string;
}

export interface ClassLevel {
  id: string;
  school_id: string;
  name: string; // e.g. "Primary 1", "JHS 1", "JHS 3"
  sort_order: number;
  is_terminal: boolean; // e.g. JHS 3 / SHS 3 is terminal -> triggers Graduation
}

export interface Stream {
  id: string;
  school_id: string;
  name: string; // e.g. "A", "B", "Gold", "Green"
}

export interface Subject {
  id: string;
  school_id: string;
  class_level_id: string;
  name: string; // e.g. "Mathematics", "Integrated Science"
  code: string; // e.g. "MATH", "SCI"
}

export interface Student {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  gender: 'Male' | 'Female';
  dob: string;
  class_level_id: string;
  stream_id: string | null; // null if single-stream mode
  status: 'Active' | 'Graduated' | 'Repeated' | 'Withdrawn';
  ghana_id: string; // GHA-XXXXXXXXX-X
  medical_info: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  teacher_id: string;
  academic_year: string; // e.g. "2025/2026"
  // Class teacher assignment
  class_level_id?: string | null;
  stream_id?: string | null;
  // Subject teacher assignment
  subject_id?: string | null;
}

export interface Assessment {
  id: string;
  school_id: string;
  student_id: string;
  subject_id: string;
  class_level_id: string;
  term: string; // "Term 1", "Term 2", "Term 3"
  academic_year: string;
  class_score: number; // 0-100
  exam_score: number; // 0-100
  average_score: number; // (class_score + exam_score) / 2
  recorded_by: string; // teacher_id
  teacher_signature_date: string | null;
  created_at: string;
}

export interface Attendance {
  id: string; // student_id_date composite key
  school_id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  comment: string;
  term: string;
  academic_year: string;
}

export interface FeeType {
  id: string;
  school_id: string;
  name: string; // e.g. "Tuition Fee", "PTA Levy", "Exam Fee"
  amount: number;
}

export interface FeePayment {
  id: string;
  school_id: string;
  student_id: string;
  fee_type_id: string;
  amount_paid: number;
  payment_date: string;
  receipt_number: string; // REC-XXXXXX
  term: string;
  academic_year: string;
  collector_id: string; // user_id
}

export interface TimetablePeriod {
  id: string;
  school_id: string;
  class_level_id: string;
  stream_id: string | null;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  subject_id: string;
  teacher_id: string;
  is_break: boolean;
}

export interface LeaveRequest {
  id: string;
  school_id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by: string | null;
  created_at: string;
}

// Seed Data
const defaultSchools: School[] = [
  { id: 'sch-01', name: 'Accra High School', code: 'AHS01', region: 'Greater Accra', multi_stream_mode: true, pass_mark: 50, created_at: '2025-01-15T08:00:00Z' },
  { id: 'sch-02', name: 'Kumasi Academy', code: 'KAC02', region: 'Ashanti', multi_stream_mode: false, pass_mark: 55, created_at: '2025-02-10T09:00:00Z' },
];

const defaultProfiles: Profile[] = [
  { id: 'prof-super', email: 'superadmin@moe.gov.gh', role: 'superadmin', name: 'Efua Mensah', school_id: null, designation: 'MoE Senior Coordinator', created_at: '2025-01-01T08:00:00Z' },
  { id: 'prof-admin-accra', email: 'kofi.appiah@accrahigh.edu.gh', role: 'admin', name: 'Kofi Appiah', school_id: 'sch-01', designation: 'Accra High Headmaster', created_at: '2025-01-20T08:00:00Z' },
  { id: 'prof-admin-kumasi', email: 'kwame.owusu@kumasi.edu.gh', role: 'admin', name: 'Kwame Owusu', school_id: 'sch-02', designation: 'Kumasi Academy Principal', created_at: '2025-02-15T08:00:00Z' },
  { id: 'prof-teach-ama', email: 'ama.serwaa@accrahigh.edu.gh', role: 'teacher', name: 'Ama Serwaa', school_id: 'sch-01', designation: 'Tutor', created_at: '2025-01-22T08:00:00Z' },
  { id: 'prof-teach-kwame', email: 'kwame.boateng@accrahigh.edu.gh', role: 'teacher', name: 'Kwame Boateng', school_id: 'sch-01', designation: 'Senior Science Tutor', created_at: '2025-01-25T08:00:00Z' },
];

const defaultClassLevels: ClassLevel[] = [
  { id: 'cls-jhs1', school_id: 'sch-01', name: 'JHS 1', sort_order: 1, is_terminal: false },
  { id: 'cls-jhs2', school_id: 'sch-01', name: 'JHS 2', sort_order: 2, is_terminal: false },
  { id: 'cls-jhs3', school_id: 'sch-01', name: 'JHS 3', sort_order: 3, is_terminal: true },
  { id: 'cls-shs1', school_id: 'sch-02', name: 'SHS 1', sort_order: 1, is_terminal: false },
  { id: 'cls-shs2', school_id: 'sch-02', name: 'SHS 2', sort_order: 2, is_terminal: false },
  { id: 'cls-shs3', school_id: 'sch-02', name: 'SHS 3', sort_order: 3, is_terminal: true },
];

const defaultStreams: Stream[] = [
  { id: 'strm-a', school_id: 'sch-01', name: 'A' },
  { id: 'strm-b', school_id: 'sch-01', name: 'B' },
];

const defaultSubjects: Subject[] = [
  { id: 'sub-math-jhs1', school_id: 'sch-01', class_level_id: 'cls-jhs1', name: 'Mathematics', code: 'MATH' },
  { id: 'sub-sci-jhs1', school_id: 'sch-01', class_level_id: 'cls-jhs1', name: 'Integrated Science', code: 'SCI' },
  { id: 'sub-eng-jhs1', school_id: 'sch-01', class_level_id: 'cls-jhs1', name: 'English Language', code: 'ENG' },
  { id: 'sub-math-jhs2', school_id: 'sch-01', class_level_id: 'cls-jhs2', name: 'Mathematics', code: 'MATH' },
  { id: 'sub-sci-jhs2', school_id: 'sch-01', class_level_id: 'cls-jhs2', name: 'Integrated Science', code: 'SCI' },
  { id: 'sub-phy-shs1', school_id: 'sch-02', class_level_id: 'cls-shs1', name: 'Physics', code: 'PHY' },
];

const defaultStudents: Student[] = [
  { id: 'std-01', school_id: 'sch-01', first_name: 'Yao', last_name: 'Osei', gender: 'Male', dob: '2013-05-14', class_level_id: 'cls-jhs1', stream_id: 'strm-a', status: 'Active', ghana_id: 'GHA-789012345-1', medical_info: 'Asthma - keep inhaler in bag', emergency_contact_name: 'Isaac Osei', emergency_contact_phone: '+233 24 123 4567', created_at: '2025-09-01T08:00:00Z' },
  { id: 'std-02', school_id: 'sch-01', first_name: 'Adwoa', last_name: 'Mensah', gender: 'Female', dob: '2013-08-22', class_level_id: 'cls-jhs1', stream_id: 'strm-a', status: 'Active', ghana_id: 'GHA-123456789-2', medical_info: 'Penicillin allergy', emergency_contact_name: 'Efua Mensah', emergency_contact_phone: '+233 20 987 6543', created_at: '2025-09-01T08:00:00Z' },
  { id: 'std-03', school_id: 'sch-01', first_name: 'Kwabena', last_name: 'Owusu', gender: 'Male', dob: '2013-02-10', class_level_id: 'cls-jhs1', stream_id: 'strm-b', status: 'Active', ghana_id: 'GHA-456789012-3', medical_info: 'None', emergency_contact_name: 'Mary Owusu', emergency_contact_phone: '+233 55 456 7890', created_at: '2025-09-01T08:00:00Z' },
  { id: 'std-04', school_id: 'sch-01', first_name: 'Abena', last_name: 'Pokua', gender: 'Female', dob: '2012-11-30', class_level_id: 'cls-jhs2', stream_id: 'strm-a', status: 'Active', ghana_id: 'GHA-987654321-4', medical_info: 'None', emergency_contact_name: 'George Poku', emergency_contact_phone: '+233 24 555 1234', created_at: '2025-09-01T08:00:00Z' },
  { id: 'std-05', school_id: 'sch-01', first_name: 'Ekow', last_name: 'Mensah', gender: 'Male', dob: '2011-04-18', class_level_id: 'cls-jhs3', stream_id: 'strm-a', status: 'Graduated', ghana_id: 'GHA-234567890-5', medical_info: 'None', emergency_contact_name: 'Kofi Mensah', emergency_contact_phone: '+233 27 666 9876', created_at: '2024-09-01T08:00:00Z' },
];

const defaultTeacherAssignments: TeacherAssignment[] = [
  // Class teacher JHS 1A
  { id: 'ta-01', school_id: 'sch-01', teacher_id: 'prof-teach-ama', academic_year: '2025/2026', class_level_id: 'cls-jhs1', stream_id: 'strm-a', subject_id: null },
  // Subject teacher assignments
  { id: 'ta-02', school_id: 'sch-01', teacher_id: 'prof-teach-kwame', academic_year: '2025/2026', class_level_id: 'cls-jhs1', stream_id: 'strm-a', subject_id: 'sub-sci-jhs1' },
  { id: 'ta-03', school_id: 'sch-01', teacher_id: 'prof-teach-kwame', academic_year: '2025/2026', class_level_id: 'cls-jhs1', stream_id: 'strm-b', subject_id: 'sub-sci-jhs1' },
  { id: 'ta-04', school_id: 'sch-01', teacher_id: 'prof-teach-ama', academic_year: '2025/2026', class_level_id: 'cls-jhs1', stream_id: 'strm-a', subject_id: 'sub-math-jhs1' },
];

const defaultFeeTypes: FeeType[] = [
  { id: 'ft-tui', school_id: 'sch-01', name: 'Tuition Fee', amount: 1200 },
  { id: 'ft-pta', school_id: 'sch-01', name: 'PTA Levy', amount: 150 },
  { id: 'ft-exam', school_id: 'sch-01', name: 'Exam Fee', amount: 100 },
];

const defaultFeePayments: FeePayment[] = [
  { id: 'pay-01', school_id: 'sch-01', student_id: 'std-01', fee_type_id: 'ft-tui', amount_paid: 1200, payment_date: '2026-06-01', receipt_number: 'REC-100201', term: 'Term 1', academic_year: '2025/2026', collector_id: 'prof-admin-accra' },
  { id: 'pay-02', school_id: 'sch-01', student_id: 'std-02', fee_type_id: 'ft-tui', amount_paid: 600, payment_date: '2026-06-02', receipt_number: 'REC-100202', term: 'Term 1', academic_year: '2025/2026', collector_id: 'prof-admin-accra' },
  { id: 'pay-03', school_id: 'sch-01', student_id: 'std-03', fee_type_id: 'ft-pta', amount_paid: 150, payment_date: '2026-06-03', receipt_number: 'REC-100203', term: 'Term 1', academic_year: '2025/2026', collector_id: 'prof-admin-accra' },
];

const defaultAttendance: Attendance[] = [
  { id: 'std-01_2026-06-15', school_id: 'sch-01', student_id: 'std-01', date: '2026-06-15', status: 'Present', comment: '', term: 'Term 1', academic_year: '2025/2026' },
  { id: 'std-02_2026-06-15', school_id: 'sch-01', student_id: 'std-02', date: '2026-06-15', status: 'Absent', comment: 'Malaria fever', term: 'Term 1', academic_year: '2025/2026' },
  { id: 'std-03_2026-06-15', school_id: 'sch-01', student_id: 'std-03', date: '2026-06-15', status: 'Late', comment: 'Lorry broke down', term: 'Term 1', academic_year: '2025/2026' },
];

const defaultAssessments: Assessment[] = [
  { id: 'asm-01', school_id: 'sch-01', student_id: 'std-01', subject_id: 'sub-math-jhs1', class_level_id: 'cls-jhs1', term: 'Term 1', academic_year: '2025/2026', class_score: 80, exam_score: 90, average_score: 85, recorded_by: 'prof-teach-ama', teacher_signature_date: '2026-06-10', created_at: '2026-06-10T10:00:00Z' },
  { id: 'asm-02', school_id: 'sch-01', student_id: 'std-02', subject_id: 'sub-math-jhs1', class_level_id: 'cls-jhs1', term: 'Term 1', academic_year: '2025/2026', class_score: 65, exam_score: 75, average_score: 70, recorded_by: 'prof-teach-ama', teacher_signature_date: '2026-06-10', created_at: '2026-06-10T10:10:00Z' },
  { id: 'asm-03', school_id: 'sch-01', student_id: 'std-03', subject_id: 'sub-math-jhs1', class_level_id: 'cls-jhs1', term: 'Term 1', academic_year: '2025/2026', class_score: 40, exam_score: 50, average_score: 45, recorded_by: 'prof-teach-ama', teacher_signature_date: '2026-06-10', created_at: '2026-06-10T10:20:00Z' },
];

const defaultTimetable: TimetablePeriod[] = [
  { id: 'tp-01', school_id: 'sch-01', class_level_id: 'cls-jhs1', stream_id: 'strm-a', day: 'Monday', start_time: '08:00', end_time: '09:00', subject_id: 'sub-math-jhs1', teacher_id: 'prof-teach-ama', is_break: false },
  { id: 'tp-02', school_id: 'sch-01', class_level_id: 'cls-jhs1', stream_id: 'strm-a', day: 'Monday', start_time: '09:00', end_time: '10:00', subject_id: 'sub-sci-jhs1', teacher_id: 'prof-teach-kwame', is_break: false },
  { id: 'tp-03', school_id: 'sch-01', class_level_id: 'cls-jhs1', stream_id: 'strm-a', day: 'Monday', start_time: '10:00', end_time: '10:30', subject_id: '', teacher_id: '', is_break: true },
];

const defaultLeaveRequests: LeaveRequest[] = [
  { id: 'leave-01', school_id: 'sch-01', teacher_id: 'prof-teach-kwame', start_date: '2026-06-20', end_date: '2026-06-25', reason: 'Medical Checkup in Kumasi', status: 'Pending', approved_by: null, created_at: '2026-06-15T09:00:00Z' },
];

// Database Engine Wrapper
class LocalDatabase {
  constructor() {
    this.initTable('schools', defaultSchools);
    this.initTable('profiles', defaultProfiles);
    this.initTable('class_levels', defaultClassLevels);
    this.initTable('streams', defaultStreams);
    this.initTable('subjects', defaultSubjects);
    this.initTable('students', defaultStudents);
    this.initTable('teacher_assignments', defaultTeacherAssignments);
    this.initTable('fee_types', defaultFeeTypes);
    this.initTable('fee_payments', defaultFeePayments);
    this.initTable('attendance', defaultAttendance);
    this.initTable('assessments', defaultAssessments);
    this.initTable('timetables', defaultTimetable);
    this.initTable('leave_requests', defaultLeaveRequests);
  }

  private initTable(key: string, defaultData: any) {
    if (!localStorage.getItem(`gsms_${key}`)) {
      localStorage.setItem(`gsms_${key}`, JSON.stringify(defaultData));
    }
  }

  public getTable<T>(key: string): T[] {
    return JSON.parse(localStorage.getItem(`gsms_${key}`) || '[]');
  }

  public saveTable<T>(key: string, data: T[]): void {
    localStorage.setItem(`gsms_${key}`, JSON.stringify(data));
  }
}

export const db = new LocalDatabase();

// Builder Class for Mock Supabase
class QueryBuilder<T> {
  private tableName: string;
  private currentData: any[];
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.currentData = db.getTable<any>(tableName);
  }

  select(columns = "*") {
    this.operation = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.currentData = this.currentData.filter(item => item[column] === value);
    return this;
  }

  match(filters: Record<string, any>) {
    this.currentData = this.currentData.filter(item => {
      return Object.entries(filters).every(([key, val]) => item[key] === val);
    });
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.currentData.sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1;
      if (a[column] > b[column]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  insert(records: any | any[]) {
    this.operation = 'insert';
    this.payload = records;
    return this;
  }

  update(fields: Partial<T>) {
    this.operation = 'update';
    this.payload = fields;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  // Resolves the promise chain
  async then(resolve: (res: { data: any; error: any }) => void) {
    let result: any = null;
    const tableData = db.getTable<any>(this.tableName);

    if (this.operation === 'select') {
      result = this.currentData;
    } 
    else if (this.operation === 'insert') {
      const arr = Array.isArray(this.payload) ? this.payload : [this.payload];
      const added: any[] = [];
      
      arr.forEach(rec => {
        const newRec = {
          id: rec.id || `${this.tableName.substring(0,3)}-${Date.now()}-${Math.floor(Math.random()*1050)}`,
          created_at: new Date().toISOString(),
          ...rec
        };
        tableData.push(newRec);
        added.push(newRec);
      });

      db.saveTable(this.tableName, tableData);
      result = Array.isArray(this.payload) ? added : added[0];
    } 
    else if (this.operation === 'update') {
      const matchingIds = this.currentData.map(item => item.id);
      const updated: any[] = [];

      const newTableData = tableData.map(item => {
        if (matchingIds.includes(item.id)) {
          const up = { ...item, ...this.payload };
          updated.push(up);
          return up;
        }
        return item;
      });

      db.saveTable(this.tableName, newTableData);
      result = updated;
    } 
    else if (this.operation === 'delete') {
      const matchingIds = this.currentData.map(item => item.id);
      const newTableData = tableData.filter(item => !matchingIds.includes(item.id));
      db.saveTable(this.tableName, newTableData);
      result = this.currentData;
    }

    resolve({ data: result, error: null });
  }
}

// Client Export
export const supabase = {
  from: <T = any>(table: string) => {
    return new QueryBuilder<T>(table);
  },

  auth: {
    signInWithPassword: async ({ email, password }: any) => {
      const profiles = db.getTable<Profile>('profiles');
      const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // Mock session caching
        localStorage.setItem('gsms_session', JSON.stringify({ user }));
        return { data: { user, session: { access_token: `mock-jwt-token-${user.id}` } }, error: null };
      }
      return { data: { user: null, session: null }, error: new Error('Invalid email or password.') };
    },

    signUp: async ({ email, password, options }: any) => {
      const profiles = db.getTable<Profile>('profiles');
      const exists = profiles.some(p => p.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return { data: { user: null }, error: new Error('User already exists.') };
      }

      const newProfile: Profile = {
        id: `prof-${Date.now()}`,
        email,
        role: options?.data?.role || 'teacher',
        name: options?.data?.name || email.split('@')[0],
        school_id: options?.data?.school_id || null,
        designation: options?.data?.designation || 'Staff',
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      db.saveTable('profiles', profiles);

      return { data: { user: newProfile }, error: null };
    },

    signOut: async () => {
      localStorage.removeItem('gsms_session');
      return { error: null };
    },

    getSession: async () => {
      const session = localStorage.getItem('gsms_session');
      return { data: { session: session ? JSON.parse(session) : null }, error: null };
    }
  }
};
export const mockUsers = [];
