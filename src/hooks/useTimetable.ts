import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

interface TimetableSettings {
  startTime: string; // "08:00"
  periodDuration: number; // 40 mins
  periodsCount: number; // 6 periods
  breakPeriodAfter: number; // after period 3 (at 10:00)
  breakDuration: number; // 30 mins
}

export function useTimetable(schoolId: string | null) {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/timetables');
      if (data) {
        // Map to backward compatible structures
        const mapped = data.map((t: any) => ({
          id: t.id,
          school_id: schoolId,
          class_level_id: t.classLevel,
          stream_id: t.stream,
          day: t.day,
          start_time: t.startTime,
          end_time: t.endTime,
          subject_id: t.subjectCode,
          teacher_id: t.teacherId,
          is_break: t.isBreak
        }));
        setTimetable(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [schoolId]);

  const savePeriod = async (period: any) => {
    if (!schoolId) return;
    try {
      const payload = {
        classLevel: period.class_level_id,
        stream: period.stream_id || 'A',
        day: period.day,
        startTime: period.start_time,
        endTime: period.end_time,
        subjectCode: period.subject_id,
        teacherId: period.teacher_id,
        isBreak: !!period.is_break
      };

      await apiFetch('/api/timetables', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      fetchTimetable();
    } catch (err) {
      console.error('Failed to save timetable period:', err);
    }
  };

  const deletePeriod = async (id: string) => {
    try {
      await apiFetch(`/api/timetables/${id}`, {
        method: 'DELETE'
      });
      fetchTimetable();
    } catch (err) {
      console.error('Failed to delete period:', err);
    }
  };

  const generateAITimetable = async (
    classLevelId: string,
    streamId: string | null,
    academicYear: string,
    settings: TimetableSettings
  ) => {
    if (!schoolId) return { success: false, message: 'No school specified.' };

    try {
      const data = await apiFetch('/api/data');
      if (!data) return { success: false, message: 'Database fetch failed.' };

      // Get curriculum subjects and teachers to assign
      const schoolTeachers = data.teachers.filter((t: any) => t.schoolName === schoolId);
      const classAssignments: any[] = [];

      schoolTeachers.forEach((t: any) => {
        // Find user
        const matchedUser = data.users.find((u: any) => u.email.toLowerCase() === t.email.toLowerCase() && u.schoolName === schoolId);
        const userId = matchedUser ? matchedUser.id : `u-${t.teacherId}`;

        if (t.classAssignments && Array.isArray(t.classAssignments)) {
          t.classAssignments.forEach((c: any) => {
            if (c.classLevel === classLevelId) {
              classAssignments.push({
                teacherId: userId,
                subjectCode: c.subjectCode
              });
            }
          });
        }
      });

      if (classAssignments.length === 0) {
        return { success: false, message: 'No subjects/teachers mapped to this class level.' };
      }

      // Delete existing entries for this class/stream
      const toDelete = timetable.filter(
        p => p.class_level_id === classLevelId && p.stream_id === streamId
      );
      for (const p of toDelete) {
        await apiFetch(`/api/timetables/${p.id}`, { method: 'DELETE' });
      }

      const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
      ];

      const generated: any[] = [];

      for (const day of days) {
        let currentTime = settings.startTime;

        for (let pNum = 1; pNum <= settings.periodsCount; pNum++) {
          const [hours, minutes] = currentTime.split(':').map(Number);
          const start = currentTime;

          let endHours = hours;
          let endMinutes = minutes + settings.periodDuration;
          if (endMinutes >= 60) {
            endHours += Math.floor(endMinutes / 60);
            endMinutes = endMinutes % 60;
          }
          const end = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

          // Lunch Break check
          if (pNum - 1 === settings.breakPeriodAfter) {
            generated.push({
              classLevel: classLevelId,
              stream: streamId || 'A',
              day,
              startTime: start,
              endTime: (() => {
                let bh = endHours;
                let bm = minutes + settings.breakDuration;
                if (bm >= 60) {
                  bh += Math.floor(bm / 60);
                  bm = bm % 60;
                }
                return `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;
              })(),
              subjectCode: '',
              teacherId: '',
              isBreak: true
            });

            let bh = hours;
            let bm = minutes + settings.breakDuration;
            if (bm >= 60) {
              bh += Math.floor(bm / 60);
              bm = bm % 60;
            }
            currentTime = `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;
            continue;
          }

          // Schedule study period
          let scheduled = false;
          const shuffledAssigns = [...classAssignments].sort(() => Math.random() - 0.5);

          for (const assign of shuffledAssigns) {
            const teacherId = assign.teacherId;
            const subjectCode = assign.subjectCode;

            // Check if teacher busy elsewhere (existing other-class schedules plus
            // periods already generated earlier in this run).
            const otherSchedules = timetable.filter(p => !(p.class_level_id === classLevelId && p.stream_id === streamId));
            const isBusy = [...otherSchedules, ...generated].some(
              p => p.day === day &&
                   p.teacher_id === teacherId &&
                   ((p.start_time >= start && p.start_time < end) || (p.end_time > start && p.end_time <= end))
            );

            if (!isBusy) {
              generated.push({
                classLevel: classLevelId,
                stream: streamId || 'A',
                day,
                startTime: start,
                endTime: end,
                subjectCode: subjectCode,
                teacherId: teacherId,
                isBreak: false
              });
              scheduled = true;
              break;
            }
          }

          if (!scheduled) {
            generated.push({
              classLevel: classLevelId,
              stream: streamId || 'A',
              day,
              startTime: start,
              endTime: end,
              subjectCode: 'Free Study',
              teacherId: '',
              isBreak: false
            });
          }

          currentTime = end;
        }
      }

      // Save all generated periods to backend
      for (const p of generated) {
        await apiFetch('/api/timetables', {
          method: 'POST',
          body: JSON.stringify(p)
        });
      }

      fetchTimetable();
      return { success: true, message: `Clash-free AI Timetable generated for this class stream.` };
    } catch (err: any) {
      console.error('Failed to generate AI timetable:', err);
      return { success: false, message: err.message || 'AI Timetable run failed.' };
    }
  };

  return { timetable, loading, savePeriod, deletePeriod, generateAITimetable, refresh: fetchTimetable };
}
