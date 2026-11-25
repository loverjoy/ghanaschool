import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { Check, Loader2, Sparkles, HelpCircle } from 'lucide-react';

const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

export default function AttendancePage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams } = useClassLevels(schoolId);
  const { students } = useStudents(schoolId);
  const { attendance, saveWeeklyAttendance } = useAttendance(schoolId);

  // Scope selection
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  
  // Date selection: default to current week's Monday
  const [mondayDate, setMondayDate] = useState(() => {
    const mon = getMonday(new Date());
    return mon.toISOString().split('T')[0];
  });

  // Local grid edits: { [studentId]: { [dateStr]: 'Present' | 'Absent' | 'Late' | 'Excused' } }
  const [gridEdits, setGridEdits] = useState<Record<string, Record<string, 'Present' | 'Absent' | 'Late' | 'Excused'>>>({});
  const [saving, setSaving] = useState(false);
  const [editsDirty, setEditsDirty] = useState(false);

  // Set default dropdown scopes
  useEffect(() => {
    if (classLevels.length > 0) {
      setSelectedClassId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setSelectedStreamId(streams[0].id);
    }
  }, [classLevels, streams]);

  // Compute five days of the selected week (Mon - Fri)
  const getWeekDays = () => {
    const days: string[] = [];
    const baseDate = new Date(mondayDate);
    for (let i = 0; i < 5; i++) {
      const next = new Date(baseDate);
      next.setDate(baseDate.getDate() + i);
      days.push(next.toISOString().split('T')[0]);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const classStudents = students.filter(
    s => s.class_level_id === selectedClassId &&
         s.status === 'Active' &&
         (school?.multi_stream_mode ? s.stream_id === selectedStreamId : true)
  );

  // Build the default grid: database records where present, otherwise 'Present'.
  const buildDefaultEdits = () => {
    const newEdits: typeof gridEdits = {};
    classStudents.forEach(student => {
      newEdits[student.id] = {};
      weekDays.forEach(dateStr => {
        const key = `${student.id}_${dateStr}`;
        const record = attendance.find(a => a.id === key);
        newEdits[student.id][dateStr] = record ? record.status : 'Present';
      });
    });
    return newEdits;
  };

  // Reset the grid whenever the scope changes.
  const scopeKey = `${selectedClassId}|${selectedStreamId}|${mondayDate}`;
  const [lastScope, setLastScope] = useState('');
  useEffect(() => {
    if (scopeKey !== lastScope) {
      setLastScope(scopeKey);
      setGridEdits(buildDefaultEdits());
      setEditsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeKey]);

  // Sync database attendance into local grid when data changes — but only if
  // the user has no unsaved edits in flight.
  useEffect(() => {
    if (editsDirty) return;
    setGridEdits(buildDefaultEdits());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendance, students]);

  const handleCellChange = (studentId: string, dateStr: string, status: any) => {
    setEditsDirty(true);
    setGridEdits(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [dateStr]: status
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: any[] = [];

    Object.entries(gridEdits).forEach(([studentId, dates]) => {
      Object.entries(dates).forEach(([dateStr, status]) => {
        payload.push({
          studentId,
          date: dateStr,
          status,
          comment: '',
          term,
          academicYear
        });
      });
    });

    const saved = await saveWeeklyAttendance(payload);
    setSaving(false);
    setEditsDirty(false);
    if (saved) {
      alert('Weekly attendance committed successfully.');
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Absent': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Late': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Excused': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Weekly Attendance Grid</h1>
          <p className="text-sm text-slate-500">Bulk mark attendance for an entire class roster across a 5-day week.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || classStudents.length === 0}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition text-sm flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Commit Weekly Roster
        </button>
      </div>

      {/* Scope Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Class Level</label>
          <select
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classLevels.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {school?.multi_stream_mode && (
          <div className="flex-1 min-w-[100px] space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Stream</label>
            <select
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
            >
              {streams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[120px] space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Term</label>
          <select
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>

        <div className="flex-1 min-w-[120px] space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Academic Year</label>
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Select Week (Monday)</label>
          <input
            type="date"
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
            value={mondayDate}
            onChange={(e) => setMondayDate(getMonday(new Date(e.target.value)).toISOString().split('T')[0])}
          />
        </div>
      </div>

      {/* Grid view */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
        {classStudents.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No active students found matching the selected class/stream scope.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-3 w-1/4">Student Name</th>
                  {weekDays.map(dateStr => {
                    const dateObj = new Date(dateStr);
                    const formatted = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                    return (
                      <th key={dateStr} className="pb-3 text-center">
                        {formatted}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {classStudents.map((student) => (
                  <tr key={student.id} className="text-slate-800 dark:text-slate-300">
                    <td className="py-4 font-semibold text-slate-900 dark:text-white">
                      {student.first_name} {student.last_name}
                    </td>
                    {weekDays.map(dateStr => {
                      const activeVal = gridEdits[student.id]?.[dateStr] || 'Present';
                      return (
                        <td key={dateStr} className="py-4 text-center">
                          <select
                            value={activeVal}
                            onChange={(e) => handleCellChange(student.id, dateStr, e.target.value as any)}
                            className={`border text-[11px] font-bold rounded-lg px-2 py-1 outline-none transition cursor-pointer ${getStatusBg(activeVal)}`}
                          >
                            <option value="Present" className="bg-white dark:bg-slate-900 text-emerald-500">Present</option>
                            <option value="Absent" className="bg-white dark:bg-slate-900 text-red-500">Absent</option>
                            <option value="Late" className="bg-white dark:bg-slate-900 text-amber-500">Late</option>
                            <option value="Excused" className="bg-white dark:bg-slate-900 text-blue-500">Excused</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
