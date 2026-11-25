import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

export function useAssessments(schoolId: string | null) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/data');
      if (data && data.assessments) {
        // Filter and map to be backward compatible
        const schoolAsms = data.assessments.filter((a: any) => a.schoolName === schoolId);
        
        // Find students to map class levels
        const mapped = schoolAsms.map((a: any) => {
          const student = data.students.find((s: any) => s.studentId === a.studentId);
          const classLevel = student ? student.classLevel : 'JHS 1';

          return {
            id: a.id,
            school_id: schoolId,
            student_id: a.studentId,
            subject_id: a.subjectCode,
            class_level_id: classLevel,
            term: a.term,
            // Use the "YYYY/YYYY+1" academic-year format consumers filter on
            // (StudentsPage, AssessmentsPage).
            academic_year: a.year ? `${a.year}/${Number(a.year) + 1}` : '2025/2026',
            class_score: Number(a.classScore || 0),
            exam_score: Number(a.examScore || 0),
            average_score: (Number(a.classScore || 0) + Number(a.examScore || 0)) / 2,
            recorded_by: a.recordedBy || 'TCH0001',
            teacher_signature_date: a.signatureDate || null
          };
        });

        setAssessments(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [schoolId]);

  const saveAssessment = async (gradeData: {
    studentId: string;
    classLevelId: string;
    subjectId: string;
    term: string;
    academicYear: string;
    classScore: number;
    examScore: number;
    teacherId: string;
    signatureDate: string | null;
  }) => {
    if (!schoolId) return;

    const cScore = Number(gradeData.classScore);
    const eScore = Number(gradeData.examScore);
    if (isNaN(cScore) || cScore < 0 || cScore > 100 || isNaN(eScore) || eScore < 0 || eScore > 100) {
      throw new Error('Assessment scores must be in range 0 - 100.');
    }

    try {
      // Find if we already have an assessment ID to overwrite
      const existing = assessments.find(
        a => a.student_id === gradeData.studentId &&
             a.subject_id === gradeData.subjectId &&
             a.term === gradeData.term &&
             a.academic_year === gradeData.academicYear
      );

      const payload = {
        id: existing ? existing.id : `asm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId: gradeData.studentId,
        subjectCode: gradeData.subjectId,
        term: gradeData.term,
        year: isNaN(parseInt(gradeData.academicYear)) ? 2026 : parseInt(gradeData.academicYear),
        classScore: gradeData.classScore,
        examScore: gradeData.examScore,
        recordedBy: gradeData.teacherId,
        signatureDate: gradeData.signatureDate
      };

      await apiFetch('/api/assessments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      fetchAssessments();
    } catch (err: any) {
      console.error('Failed to save assessment:', err);
      throw err;
    }
  };

  return { assessments, loading, saveAssessment, refresh: fetchAssessments };
}
