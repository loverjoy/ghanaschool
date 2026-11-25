import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useTeachers } from '../hooks/useTeachers';
import { useTimetable } from '../hooks/useTimetable';
import { Calendar, Plus, Sparkles, Loader2, Trash2, Cpu } from 'lucide-react';

export default function TimetablePage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams, subjects } = useClassLevels(schoolId);
  const { teachers } = useTeachers(schoolId);
  const { timetable, generateAITimetable, deletePeriod } = useTimetable(schoolId);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [academicYear, setAcademicYear] = useState('2025/2026');

  // AI Settings Form
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState(40);
  const [count, setCount] = useState(6);
  const [breakAfter, setBreakAfter] = useState(3);
  const [breakDur, setBreakDur] = useState(30);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Set default selectors
  useEffect(() => {
    if (classLevels.length > 0) {
      setSelectedClassId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setSelectedStreamId(streams[0].id);
    }
  }, [classLevels, streams]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !school) return;

    setLoading(true);
    setMsg('');

    const res = await generateAITimetable(
      selectedClassId,
      school.multi_stream_mode ? selectedStreamId : null,
      academicYear,
      {
        startTime,
        periodDuration: Number(duration),
        periodsCount: Number(count),
        breakPeriodAfter: Number(breakAfter),
        breakDuration: Number(breakDur)
      }
    );

    setMsg(res.message);
    setLoading(false);
    setTimeout(() => setMsg(''), 4000);
  };

  // Filter timetable for selected scope
  const activePeriods = timetable.filter(
    p => p.class_level_id === selectedClassId &&
         (school?.multi_stream_mode ? p.stream_id === selectedStreamId : true)
  );

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Academic Timetable Planner</h1>
          <p className="text-sm text-slate-500">Configure manual schedules or trigger the AI clash-free heuristic auto-generator.</p>
        </div>
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Academic Year</label>
          <input
            type="text"
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI generator settings */}
        {user?.role === 'admin' && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
                <Cpu size={16} /> AI Auto-Scheduler
              </h3>

              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Start Time</label>
                    <input
                      type="text"
                      required
                      placeholder="08:00"
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Period (Mins)</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Periods Count</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lunch After</label>
                    <input
                      type="number"
                      placeholder="Period #"
                      required
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={breakAfter}
                      onChange={(e) => setBreakAfter(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lunch Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={breakDur}
                    onChange={(e) => setBreakDur(Number(e.target.value))}
                  />
                </div>

                {msg && (
                  <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded p-2.5 text-center">
                    {msg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition text-xs flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Resolving Conflicts...
                    </>
                  ) : (
                    <>
                      Generate Clash-Free Grid
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Column: Display Grid Schedule */}
        <div className={`${user?.role === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} />
              Schedule Grid List
            </h3>

            <div className="space-y-4">
              {days.map(day => {
                const dayPeriods = activePeriods
                  .filter(p => p.day === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div key={day} className="border-b border-slate-100 dark:border-slate-800/60 pb-4 last:border-0 last:pb-0">
                    <h4 className="text-xs font-bold text-amber-500 mb-2">{day}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {dayPeriods.map(p => {
                        const subjectName = p.is_break 
                          ? 'Lunch Break' 
                          : p.subject_id === 'Free Study' 
                          ? 'Free Study / Library' 
                          : subjects.find(s => s.id === p.subject_id)?.name || p.subject_id;
                        
                        const teacherName = !p.is_break && p.teacher_id 
                          ? teachers.find(t => t.id === p.teacher_id)?.name || 'Tutor' 
                          : '';

                        return (
                          <div
                            key={p.id}
                            className={`p-3 border rounded-lg flex justify-between items-start text-xs ${
                              p.is_break 
                                ? 'bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 text-blue-500' 
                                : p.subject_id === 'Free Study'
                                ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-500'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850'
                            }`}
                          >
                            <div>
                              <p className="font-semibold">{subjectName}</p>
                              {teacherName && <p className="text-[10px] text-slate-500 mt-0.5">Tutor: {teacherName}</p>}
                              <p className="text-[9px] text-slate-400 mt-1">{p.start_time} - {p.end_time}</p>
                            </div>
                            
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => deletePeriod(p.id)}
                                className="p-1 hover:bg-red-500/10 text-red-500 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {dayPeriods.length === 0 && (
                        <p className="text-xs text-slate-500 italic p-2 col-span-3">No periods scheduled.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
