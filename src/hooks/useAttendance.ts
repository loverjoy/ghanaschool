import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

export function useAttendance(schoolId: string | null) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/data');
      if (data && data.attendance) {
        const schoolAtt = data.attendance.filter((a: any) => a.schoolName === schoolId);
        
        // Map to backward compatible structures
        const mapped = schoolAtt.map((a: any) => ({
          id: a.id,
          school_id: schoolId,
          student_id: a.studentId,
          date: a.date,
          status: a.status,
          comment: a.comment || '',
          term: a.term,
          academic_year: a.year ? `${a.year}/${Number(a.year) + 1}` : '2025/2026'
        }));

        setAttendance(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [schoolId]);

  const saveWeeklyAttendance = async (
    records: Array<{
      studentId: string;
      date: string;
      status: 'Present' | 'Absent' | 'Late' | 'Excused';
      comment: string;
      term: string;
      academicYear: string;
    }>
  ) => {
    if (!schoolId) return false;

    try {
      const payload = records.map(rec => ({
        studentId: rec.studentId,
        date: rec.date,
        status: rec.status,
        comment: rec.comment,
        term: rec.term,
        year: isNaN(parseInt(rec.academicYear)) ? 2026 : parseInt(rec.academicYear)
      }));

      await apiFetch('/api/attendance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      fetchAttendance();
      return true;
    } catch (err) {
      console.error('Failed to save weekly attendance:', err);
      return false;
    }
  };

  return { attendance, loading, saveWeeklyAttendance, refresh: fetchAttendance };
}
