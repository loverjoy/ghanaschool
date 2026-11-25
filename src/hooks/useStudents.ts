import { useState, useEffect } from 'react';
import { Student, ClassLevel } from '../types';
import { apiFetch } from '../apiFetch';

const CLASS_LEVEL_ORDER: ClassLevel[] = [
  "KG1",
  "KG2",
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
  "JHS 1",
  "JHS 2",
  "JHS 3"
];

export function useStudents(schoolId: string | null) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/data');
      if (data && data.students) {
        const schoolStudents = data.students.filter((s: any) => s.schoolName === schoolId);
        
        // Map to backward compatible structures for StudentsPage
        const mapped = schoolStudents.map((s: any) => {
          const nameParts = (s.name || '').split(' ');
          const first_name = nameParts[0] || '';
          const last_name = nameParts.slice(1).join(' ') || '';

          return {
            ...s,
            id: s.studentId, // backward compatibility
            first_name,
            last_name,
            dob: s.dateOfBirth || '',
            class_level_id: s.classLevel || 'JHS 1',
            stream_id: s.stream || 'A',
            // Seed data does not always carry a Ghana ID; show N/A instead of inventing one.
            ghana_id: s.ghanaId || '',
            medical_info: s.medicalInfo || 'None',
            emergency_contact_name: s.parentName || '',
            emergency_contact_phone: s.parentContact || '',
            status: s.status || 'Active'
          };
        });

        setStudents(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolId]);

  const addStudent = async (studentData: any) => {
    if (!schoolId) return null;
    try {
      const payload = {
        name: studentData.name || `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim(),
        dateOfBirth: studentData.dateOfBirth || studentData.dob || '',
        gender: studentData.gender || 'Male',
        classLevel: studentData.classLevel || studentData.class_level_id || 'JHS 1',
        stream: studentData.stream || studentData.stream_id || 'A',
        parentName: studentData.parentName || studentData.emergency_contact_name || '',
        parentContact: studentData.parentContact || studentData.emergency_contact_phone || '',
        status: studentData.status || 'Active',
        ghanaId: studentData.ghanaId || studentData.ghana_id || '',
        medicalInfo: studentData.medicalInfo || studentData.medical_info || 'None',
        photoUrl: studentData.photoUrl || '',
        csspsChoices: studentData.csspsChoices || []
      };

      const result = await apiFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      fetchStudents();
      return result.student;
    } catch (err) {
      console.error('Failed to add student:', err);
      return null;
    }
  };

  const updateStudent = async (studentId: string, fields: Partial<any>): Promise<boolean> => {
    try {
      // Fetch existing student details to merge
      const data = await apiFetch('/api/data');
      const existing = data.students.find((s: any) => s.studentId === studentId && s.schoolName === schoolId);
      if (!existing) {
        console.warn('Failed to update student: record not found.', studentId);
        return false;
      }

      const payload = {
        ...existing,
        name: fields.name || (fields.first_name || fields.last_name ? `${fields.first_name || existing.name.split(' ')[0]} ${fields.last_name || existing.name.split(' ').slice(1).join(' ')}` : existing.name),
        dateOfBirth: fields.dateOfBirth || fields.dob || existing.dateOfBirth,
        gender: fields.gender || existing.gender,
        classLevel: fields.classLevel || fields.class_level_id || existing.classLevel,
        stream: fields.stream || fields.stream_id || existing.stream,
        parentName: fields.parentName || fields.emergency_contact_name || existing.parentName,
        parentContact: fields.parentContact || fields.emergency_contact_phone || existing.parentContact,
        status: fields.status || existing.status,
        ghanaId: fields.ghanaId || fields.ghana_id || existing.ghanaId,
        medicalInfo: fields.medicalInfo || fields.medical_info || existing.medicalInfo,
        photoUrl: fields.photoUrl !== undefined ? fields.photoUrl : existing.photoUrl,
        csspsChoices: fields.csspsChoices || existing.csspsChoices
      };

      await apiFetch(`/api/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      fetchStudents();
      return true;
    } catch (err) {
      console.error('Failed to update student:', err);
      return false;
    }
  };

  // Bulk promotion algorithm
  const runBulkPromotion = async (
    classLevel: ClassLevel,
    term: string,
    academicYear: string,
    passMark: number
  ) => {
    if (!schoolId) return { success: false, message: 'No school specified.' };

    try {
      const data = await apiFetch('/api/data');
      if (!data) return { success: false, message: 'Database fetch failed.' };

      const allAssessments = data.assessments || [];
      const schoolStudents = data.students.filter((s: any) => s.schoolName === schoolId && s.classLevel === classLevel && s.status === 'Active');

      if (schoolStudents.length === 0) {
        return { success: false, message: `No active students found in ${classLevel}.` };
      }

      let promotedCount = 0;
      let graduatedCount = 0;
      let repeatedCount = 0;

      const currentIdx = CLASS_LEVEL_ORDER.indexOf(classLevel);
      const nextClassLevel = currentIdx !== -1 && currentIdx < CLASS_LEVEL_ORDER.length - 1 
        ? CLASS_LEVEL_ORDER[currentIdx + 1] 
        : null;

      for (const student of schoolStudents) {
        // Find all assessments for this student in the current year
        const studentAsms = allAssessments.filter((a: any) => 
          a.studentId === student.studentId && 
          a.term === term &&
          a.schoolName === schoolId
        );

        if (studentAsms.length === 0) {
          repeatedCount++;
          continue;
        }

        // Compute weighted final term score for each subject: (0.3 * Class Score) + (0.7 * Exam Score)
        let totalWeightedScore = 0;
        studentAsms.forEach((asm: any) => {
          const weighted = (0.3 * Number(asm.classScore || 0)) + (0.7 * Number(asm.examScore || 0));
          totalWeightedScore += weighted;
        });

        const studentAverage = totalWeightedScore / studentAsms.length;

        if (studentAverage >= passMark) {
          if (classLevel === "JHS 3") {
            // JHS 3 students graduate
            await apiFetch(`/api/students/${student.studentId}`, {
              method: 'PUT',
              body: JSON.stringify({ ...student, status: 'Graduated', classLevel: 'Graduated' })
            });
            graduatedCount++;
          } else if (nextClassLevel) {
            // Normal promotion
            await apiFetch(`/api/students/${student.studentId}`, {
              method: 'PUT',
              body: JSON.stringify({ ...student, classLevel: nextClassLevel })
            });
            promotedCount++;
          }
        } else {
          repeatedCount++;
        }
      }

      fetchStudents();
      return {
        success: true,
        message: `Bulk promotion completed. Promoted: ${promotedCount}, Graduated: ${graduatedCount}, Retained/Repeated: ${repeatedCount}`
      };
    } catch (err: any) {
      console.error('Failed to run bulk promotion:', err);
      return { success: false, message: err.message || 'Promotion run failed.' };
    }
  };

  return { students, loading, addStudent, updateStudent, runBulkPromotion, refresh: fetchStudents };
}
