import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';
import { Teacher, User, Subject } from '../types';

export function useTeachers(schoolId: string | null) {
  // StaffPage expects Profile[] as teachers (where profile has id, name, email, role, school_id, designation)
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeachersAndAssignments = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/data');
      if (data) {
        // 1. Get users who are teachers
        const teacherUsers = data.users.filter((u: any) => u.schoolName === schoolId && u.role === 'teacher');
        setTeachers(teacherUsers);

        // 2. Build assignments list from teachers data
        const schoolTeachers = data.teachers.filter((t: any) => t.schoolName === schoolId);
        const list: any[] = [];

        schoolTeachers.forEach((t: any) => {
          // Find matching user ID
          // Note: when viewing as a teacher, the server sanitizes other teachers' records without an email.
          const matchedUser = teacherUsers.find((u: any) => (t.email || '').toLowerCase() === (u.email || '').toLowerCase());
          const userId = matchedUser ? matchedUser.id : `u-${t.teacherId}`;

          // Homeroom assignment
          if (t.isClassTeacher && t.homeroomClass) {
            list.push({
              id: `ct-${t.teacherId}`,
              school_id: schoolId,
              teacher_id: userId,
              academic_year: '2025/2026',
              class_level_id: t.homeroomClass.classLevel, // Matches level id
              stream_id: t.homeroomClass.stream,
              subject_id: null
            });
          }

          // Subject assignments
          if (t.classAssignments && Array.isArray(t.classAssignments)) {
            t.classAssignments.forEach((c: any, index: number) => {
              // Map subjectCode to subjectId in frontend if needed.
              // In this case, we can find a subject in data.subjects that matches code and school.
              const subjectObj = data.subjects.find((s: any) => s.schoolName === schoolId && s.code === c.subjectCode);
              
              list.push({
                id: `st-${t.teacherId}-${index}`,
                school_id: schoolId,
                teacher_id: userId,
                academic_year: '2025/2026',
                class_level_id: c.classLevel,
                stream_id: c.stream,
                subject_id: subjectObj ? subjectObj.code : c.subjectCode // Use code as ID for lookup
              });
            });
          }
        });

        setAssignments(list);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachersAndAssignments();
  }, [schoolId]);

  const addTeacher = async (name: string, email: string, designation: string) => {
    if (!schoolId) return { error: new Error('School ID is missing.') };
    try {
      const result = await apiFetch('/api/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: '',
          qualification: designation,
          subject: '',
          classAssignments: [],
          isClassTeacher: false
        })
      });
      fetchTeachersAndAssignments();
      return { error: null, result };
    } catch (err: any) {
      console.error('Failed to add teacher:', err);
      return { error: err };
    }
  };

  const assignClassTeacher = async (
    teacherUserId: string,
    classLevel: string,
    stream: string | null,
    academicYear: string
  ) => {
    if (!schoolId) return { error: new Error('No school.') };
    try {
      const data = await apiFetch('/api/data');
      const matchedUser = data.users.find((u: any) => u.id === teacherUserId);
      if (!matchedUser) return { error: new Error('Teacher user profile not found.') };

      const matchedTeacher = data.teachers.find((t: any) => (t.email || '').toLowerCase() === (matchedUser.email || '').toLowerCase() && t.schoolName === schoolId);
      if (!matchedTeacher) return { error: new Error('Teacher record not found in directory.') };

      // Update teacher homeroom class
      const updatedTeacher = {
        ...matchedTeacher,
        isClassTeacher: true,
        homeroomClass: {
          classLevel,
          stream: stream || 'A'
        }
      };

      await apiFetch(`/api/teachers/${matchedTeacher.teacherId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTeacher)
      });

      fetchTeachersAndAssignments();
      return { error: null };
    } catch (err: any) {
      console.error('Failed to assign class teacher:', err);
      return { error: err };
    }
  };

  const assignSubjectTeacher = async (
    teacherUserId: string,
    classLevel: string,
    stream: string | null,
    subjectCode: string,
    academicYear: string
  ) => {
    if (!schoolId) return { error: new Error('No school.') };
    try {
      const data = await apiFetch('/api/data');
      const matchedUser = data.users.find((u: any) => u.id === teacherUserId);
      if (!matchedUser) return { error: new Error('Teacher user profile not found.') };

      const matchedTeacher = data.teachers.find((t: any) => (t.email || '').toLowerCase() === (matchedUser.email || '').toLowerCase() && t.schoolName === schoolId);
      if (!matchedTeacher) return { error: new Error('Teacher record not found.') };

      // Prevent duplicate mapping
      const exists = (matchedTeacher.classAssignments || []).some((c: any) => 
        c.classLevel === classLevel && c.stream === (stream || 'A') && c.subjectCode === subjectCode
      );
      if (exists) {
        return { error: new Error('This subject teacher assignment already exists.') };
      }

      const classAssignments = [...(matchedTeacher.classAssignments || []), {
        classLevel,
        stream: stream || 'A',
        subjectCode
      }];

      await apiFetch(`/api/teachers/${matchedTeacher.teacherId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...matchedTeacher,
          classAssignments
        })
      });

      fetchTeachersAndAssignments();
      return { error: null };
    } catch (err: any) {
      console.error('Failed to assign subject teacher:', err);
      return { error: err };
    }
  };

  const removeAssignment = async (id: string) => {
    // id format is `ct-TCH0001` or `st-TCH0001-index`
    try {
      const data = await apiFetch('/api/data');
      if (id.startsWith('ct-')) {
        const teacherId = id.replace('ct-', '');
        const matchedTeacher = data.teachers.find((t: any) => t.teacherId === teacherId && t.schoolName === schoolId);
        if (matchedTeacher) {
          await apiFetch(`/api/teachers/${teacherId}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...matchedTeacher,
              isClassTeacher: false,
              homeroomClass: null
            })
          });
        }
      } else if (id.startsWith('st-')) {
        const parts = id.split('-');
        const teacherId = parts[1];
        const index = parseInt(parts[2], 10);
        
        const matchedTeacher = data.teachers.find((t: any) => t.teacherId === teacherId && t.schoolName === schoolId);
        if (matchedTeacher && matchedTeacher.classAssignments) {
          const classAssignments = matchedTeacher.classAssignments.filter((_: any, idx: number) => idx !== index);
          await apiFetch(`/api/teachers/${teacherId}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...matchedTeacher,
              classAssignments
            })
          });
        }
      }
      fetchTeachersAndAssignments();
    } catch (err) {
      console.error('Failed to remove assignment:', err);
    }
  };

  return { teachers, assignments, loading, addTeacher, assignClassTeacher, assignSubjectTeacher, removeAssignment, refresh: fetchTeachersAndAssignments };
}
