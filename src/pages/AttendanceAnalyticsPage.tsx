import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { Search, BarChart3, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';

export default function AttendanceAnalyticsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams } = useClassLevels(schoolId);
  const { students } = useStudents(schoolId);
  const { attendance } = useAttendance(schoolId);

  // Scope filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState(() => `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`);

  useEffect(() => {
    if (classLevels.length > 0) {
      setSelectedClassId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setSelectedStreamId(streams[0].id);
    }
  }, [classLevels, streams]);

  const classStudents = students.filter(
    s => s.class_level_id === selectedClassId &&
         s.status === 'Active' &&
         (school?.multi_stream_mode ? s.stream_id === selectedStreamId : true)
  );

  // Compute student stats
  const analyticsData = classStudents.map(student => {
    const studentRecords = attendance.filter(
      a => a.student_id === student.id &&
           a.term === term &&
           a.academic_year === academicYear
    );

    const totalDays = studentRecords.length;
    const present = studentRecords.filter(r => r.status === 'Present').length;
    const late = studentRecords.filter(r => r.status === 'Late').length;
    const excused = studentRecords.filter(r => r.status === 'Excused').length;
    const absent = studentRecords.filter(r => r.status === 'Absent').length;

    // Rate calculations
    const presentRate = totalDays > 0 
      ? Math.round(((present + late + excused) / totalDays) * 100)
      : 100; // default to 100 if no data

    return {
      student,
      totalDays,
      present,
      late,
      excused,
      absent,
      presentRate
    };
  });

  // Calculate Class Average
  const totalDaysSampled = analyticsData.reduce((acc, curr) => acc + curr.totalDays, 0);
  const classAvgRate = analyticsData.length > 0
    ? Math.round(analyticsData.reduce((acc, curr) => acc + curr.presentRate, 0) / analyticsData.length)
    : 100;

  // High-Risk Absenteeism warning threshold (less than 85% attendance rate)
  const highRiskStudents = analyticsData.filter(d => d.totalDays > 0 && d.presentRate < 85);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Attendance Analytics Report</h1>
        <p className="text-sm text-slate-500">Calculate present rates, view trends, and monitor chronic absenteeism warnings.</p>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Analytics Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4">Pupil Attendance Stats</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3 text-center">Days Sampled</th>
                    <th className="pb-3 text-center">Present</th>
                    <th className="pb-3 text-center">Late</th>
                    <th className="pb-3 text-center">Excused</th>
                    <th className="pb-3 text-center">Absent</th>
                    <th className="pb-3 text-center">Present Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {analyticsData.map(({ student, totalDays, present, late, excused, absent, presentRate }) => (
                    <tr key={student.id} className="text-slate-800 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="py-3 text-center">{totalDays}</td>
                      <td className="py-3 text-center text-emerald-500 font-medium">{present}</td>
                      <td className="py-3 text-center text-amber-500 font-medium">{late}</td>
                      <td className="py-3 text-center text-blue-500 font-medium">{excused}</td>
                      <td className="py-3 text-center text-red-500 font-medium">{absent}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          presentRate >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
                          presentRate >= 80 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {presentRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {analyticsData.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-500">
                        No active student logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summaries & Risk warning */}
        <div className="lg:col-span-4 space-y-6">
          {/* Class average */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg">
              <BarChart3 size={32} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Class Average Attendance</p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                {classAvgRate}%
              </h2>
            </div>
          </div>

          {/* Warning List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
              <AlertTriangle size={16} /> Absenteeism Warnings
            </h3>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Students with attendance rate less than 85% require intervention under Ministry guidelines.
            </p>

            <div className="space-y-3">
              {highRiskStudents.map(({ student, presentRate, absent }) => (
                <div key={student.id} className="p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold">{student.first_name} {student.last_name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chronic Absences: {absent} days</p>
                  </div>
                  <span className="text-red-500 font-bold">{presentRate}% rate</span>
                </div>
              ))}
              {highRiskStudents.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4 flex items-center gap-1.5 justify-center">
                  <CheckCircle size={14} className="text-emerald-500" />
                  All students meet MoE standards.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
