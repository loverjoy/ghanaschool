import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { useAssessments } from '../hooks/useAssessments';
import { Check, BookOpen, AlertCircle, PenTool, BarChart3 } from 'lucide-react';

export default function AssessmentsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams, subjects } = useClassLevels(schoolId);
  const { students } = useStudents(schoolId);
  const { assessments, saveAssessment } = useAssessments(schoolId);

  // Mappings filter scope
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [academicYear, setAcademicYear] = useState('2025/2026');

  // Local states: { [studentId]: { classScore, examScore } }
  const [gradeInputs, setGradeInputs] = useState<Record<string, { classScore: string; examScore: string }>>({});
  const [isSigned, setIsSigned] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'entry' | 'class' | 'subject'>('entry');
  const canViewSheets = user?.role === 'admin' || user?.role === 'superadmin' || user?.isClassTeacher;
  const isTeacherClassTeacher = user?.role === 'teacher' && user?.isClassTeacher;

  // Set default scopes
  useEffect(() => {
    if (classLevels.length > 0) {
      setSelectedClassId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setSelectedStreamId(streams[0].id);
    }
  }, [classLevels, streams]);

  // Adjust active subjects based on class level (robust filter)
  const classSubjects = subjects.filter(
    s => s.class_level_id === selectedClassId || 
         (s.applicableLevels && s.applicableLevels.includes(selectedClassId as any))
  );

  useEffect(() => {
    if (classSubjects.length > 0) {
      setSelectedSubjectId(classSubjects[0].code || classSubjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  }, [selectedClassId, subjects]);

  // Lock selection for Class/Subject sheets if teacher is class teacher
  useEffect(() => {
    if (isTeacherClassTeacher && user?.homeroomClass) {
      if (activeTab === 'class' || activeTab === 'subject') {
        setSelectedClassId(user.homeroomClass.classLevel);
        setSelectedStreamId(user.homeroomClass.stream);
      }
    }
  }, [activeTab, isTeacherClassTeacher, user]);

  const classStudents = students.filter(
    s => s.class_level_id === selectedClassId &&
         s.status === 'Active' &&
         (school?.multi_stream_mode ? s.stream_id === selectedStreamId : true)
  );

  // Sync database assessments to local grade input grids
  useEffect(() => {
    const inputs: typeof gradeInputs = {};
    classStudents.forEach(student => {
      const match = assessments.find(
        a => a.student_id === student.id &&
             a.subject_id === selectedSubjectId &&
             a.class_level_id === selectedClassId &&
             a.term === term &&
             a.academic_year === academicYear
      );

      inputs[student.id] = {
        classScore: match ? match.class_score.toString() : '',
        examScore: match ? match.exam_score.toString() : ''
      };
    });
    setGradeInputs(inputs);
    setValidationErrors({});
    setIsSigned(false);
  }, [selectedClassId, selectedStreamId, selectedSubjectId, term, academicYear, assessments, students]);

  const handleScoreChange = (studentId: string, field: 'classScore' | 'examScore', value: string) => {
    // Sync inputs local
    setGradeInputs(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));

    // Perform CAPS range checks (0-100)
    const num = Number(value);
    if (value !== '' && (isNaN(num) || num < 0 || num > 100)) {
      setValidationErrors(prev => ({
        ...prev,
        [`${studentId}_${field}`]: 'Scores must be a number between 0 and 100.'
      }));
    } else {
      setValidationErrors(prev => {
        const copy = { ...prev };
        delete copy[`${studentId}_${field}`];
        return copy;
      });
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      alert('Please correct validation errors before publishing.');
      return;
    }
    if (!isSigned) {
      alert('You must digitally sign the assessment sheets first.');
      return;
    }

    setSaving(true);
    setMsg('');

    try {
      const today = new Date().toISOString().split('T')[0];
      for (const student of classStudents) {
        const scores = gradeInputs[student.id] || { classScore: '', examScore: '' };
        if (scores.classScore === '' || scores.examScore === '') continue;

        await saveAssessment({
          studentId: student.id,
          classLevelId: selectedClassId,
          subjectId: selectedSubjectId,
          term,
          academicYear,
          classScore: Number(scores.classScore),
          examScore: Number(scores.examScore),
          teacherId: user?.id || 'unknown',
          signatureDate: today
        });
      }
      setMsg('Student report cards published and ledger database synchronized.');
      setTimeout(() => setMsg(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Grade analytics
  const scoresSampled = classStudents
    .map(s => {
      const info = gradeInputs[s.id] || { classScore: '', examScore: '' };
      if (info.classScore === '' || info.examScore === '') return null;
      return (Number(info.classScore) + Number(info.examScore)) / 2;
    })
    .filter((v): v is number => v !== null);

  const classAvg = scoresSampled.length > 0
    ? Math.round(scoresSampled.reduce((a, b) => a + b, 0) / scoresSampled.length)
    : 0;

  const dist = { A: 0, B: 0, C: 0, F: 0 };
  scoresSampled.forEach(avg => {
    if (avg >= 80) dist.A++;
    else if (avg >= 70) dist.B++;
    else if (avg >= 50) dist.C++;
    else dist.F++;
  });

  // WAEC Grade logic helper
  const getRichGrade = (score: number) => {
    if (score >= 80) return { letter: 'A1', bece: '1', remarks: 'Excellent' };
    if (score >= 75) return { letter: 'B2', bece: '2', remarks: 'Very Good' };
    if (score >= 70) return { letter: 'B3', bece: '3', remarks: 'Good' };
    if (score >= 65) return { letter: 'C4', bece: '4', remarks: 'Credit' };
    if (score >= 60) return { letter: 'C5', bece: '5', remarks: 'Credit' };
    if (score >= 55) return { letter: 'C6', bece: '6', remarks: 'Pass' };
    if (score >= 50) return { letter: 'D7', bece: '7', remarks: 'Pass' };
    if (score >= 40) return { letter: 'E8', bece: '8', remarks: 'Pass' };
    return { letter: 'F9', bece: '9', remarks: 'Fail' };
  };

  // Class Assessment Sheet data memo
  const classSheetData = React.useMemo(() => {
    if (activeTab !== 'class') return [];

    const list = classStudents.map(student => {
      const studentSubjects: Record<string, { classScore: number | null; examScore: number | null; total: number | null }> = {};
      let totalWeightedSum = 0;
      let gradedSubjectsCount = 0;

      classSubjects.forEach(subject => {
        const match = assessments.find(
          a => a.student_id === student.id &&
               (a.subject_id === subject.code || a.subject_id === subject.id) &&
               a.class_level_id === selectedClassId &&
               a.term === term &&
               a.academic_year === academicYear
        );

        if (match) {
          const classScore = Number(match.class_score ?? 0);
          const examScore = Number(match.exam_score ?? 0);
          const weighted = (0.3 * classScore) + (0.7 * examScore);
          
          studentSubjects[subject.code] = {
            classScore,
            examScore,
            total: weighted
          };
          totalWeightedSum += weighted;
          gradedSubjectsCount++;
        } else {
          studentSubjects[subject.code] = {
            classScore: null,
            examScore: null,
            total: null
          };
        }
      });

      const overallAvg = gradedSubjectsCount > 0 ? totalWeightedSum / gradedSubjectsCount : 0;

      return {
        student,
        subjects: studentSubjects,
        overallAvg,
        hasGrades: gradedSubjectsCount > 0
      };
    });

    const sorted = [...list].filter(x => x.hasGrades).sort((a, b) => b.overallAvg - a.overallAvg);
    
    return list.map(item => {
      const position = item.hasGrades 
        ? sorted.findIndex(x => x.student.id === item.student.id) + 1 
         : 0;
      return {
        ...item,
        position
      };
    });
  }, [activeTab, classStudents, classSubjects, assessments, selectedClassId, term, academicYear]);

  // Subject Assessment Sheet data memo
  const subjectSheetData = React.useMemo(() => {
    if (activeTab !== 'subject' || !selectedSubjectId) return [];

    const list = classStudents.map(student => {
      const match = assessments.find(
        a => a.student_id === student.id &&
             (a.subject_id === selectedSubjectId || a.subject_code === selectedSubjectId) &&
             a.class_level_id === selectedClassId &&
             a.term === term &&
             a.academic_year === academicYear
      );

      if (match) {
        const classScore = Number(match.class_score ?? 0);
        const examScore = Number(match.exam_score ?? 0);
        const class50 = classScore * 0.5;
        const exam50 = examScore * 0.5;
        const total100 = class50 + exam50;

        return {
          student,
          classScore,
          class50,
          examScore,
          exam50,
          total100,
          hasGrade: true
        };
      }

      return {
        student,
        classScore: null,
        class50: null,
        examScore: null,
        exam50: null,
        total100: 0,
        hasGrade: false
      };
    });

    const sorted = [...list].filter(x => x.hasGrade).sort((a, b) => b.total100 - a.total100);

    return list.map(item => {
      const position = item.hasGrade 
        ? sorted.findIndex(x => x.student.id === item.student.id) + 1 
        : 0;
      return {
        ...item,
        position
      };
    });
  }, [activeTab, classStudents, assessments, selectedSubjectId, selectedClassId, term, academicYear]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Assessment Ledger</h1>
        <p className="text-sm text-slate-500">Record assessment class scores and exam scores with CAPS validation rules.</p>
      </div>

      {/* Tab Selector Header */}
      {canViewSheets && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'entry'
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Grade Entry
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'class'
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Class Assessment Sheet
          </button>
          <button
            onClick={() => setActiveTab('subject')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === 'subject'
                ? 'border-amber-500 text-amber-500 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Subject Assessment Sheet
          </button>
        </div>
      )}

      {/* Scope Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px] space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Class Level</label>
          <select
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none disabled:opacity-60"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            disabled={isTeacherClassTeacher && (activeTab === 'class' || activeTab === 'subject')}
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
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none disabled:opacity-60"
              value={selectedStreamId}
              onChange={(e) => setSelectedStreamId(e.target.value)}
              disabled={isTeacherClassTeacher && (activeTab === 'class' || activeTab === 'subject')}
            >
              {streams.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab !== 'class' && (
          <div className="flex-1 min-w-[150px] space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Subject</label>
            <select
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
            >
              {classSubjects.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[100px] space-y-1">
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

      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Grade input spreadsheet */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              {classStudents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No active students found in this class level/stream.
                </p>
              ) : (
                <form onSubmit={handlePublish} className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                          <th className="pb-3 w-1/3">Student Name</th>
                          <th className="pb-3 text-center w-24">Class Score</th>
                          <th className="pb-3 text-center w-24">Exam Score</th>
                          <th className="pb-3 text-center">Avg (Term contribution)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {classStudents.map(student => {
                          const info = gradeInputs[student.id] || { classScore: '', examScore: '' };
                          const finalAvg = info.classScore !== '' && info.examScore !== '' &&
                                           !isNaN(Number(info.classScore)) && !isNaN(Number(info.examScore))
                            ? ((Number(info.classScore) + Number(info.examScore)) / 2).toFixed(1)
                            : '0.0';

                          const errClass = validationErrors[`${student.id}_classScore`];
                          const errExam = validationErrors[`${student.id}_examScore`];

                          return (
                            <tr key={student.id} className="text-slate-800 dark:text-slate-300">
                              <td className="py-4 font-semibold text-slate-900 dark:text-white">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="py-4 text-center">
                                <input
                                  type="text"
                                  className={`w-16 bg-slate-100 dark:bg-slate-950 border rounded text-center py-1 text-xs outline-none ${
                                    errClass ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                  }`}
                                  value={info.classScore}
                                  onChange={(e) => handleScoreChange(student.id, 'classScore', e.target.value)}
                                />
                              </td>
                              <td className="py-4 text-center">
                                <input
                                  type="text"
                                  className={`w-16 bg-slate-100 dark:bg-slate-950 border rounded text-center py-1 text-xs outline-none ${
                                    errExam ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
                                  }`}
                                  value={info.examScore}
                                  onChange={(e) => handleScoreChange(student.id, 'examScore', e.target.value)}
                                />
                              </td>
                              <td className="py-4 text-center font-bold text-slate-950 dark:text-slate-100">
                                {finalAvg} %
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Digital Signature Date */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded"><PenTool size={18} /></div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold">Confirm Tutor Signature</p>
                      <p className="text-[10px] text-slate-400">By check-in, you certify grades comply with CAPS standard guidelines.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-4.5 h-4.5 cursor-pointer rounded text-amber-500 border-slate-800 focus:ring-0"
                      checked={isSigned}
                      onChange={(e) => setIsSigned(e.target.checked)}
                    />
                  </div>

                  {msg && (
                    <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded p-2.5 text-center">
                      {msg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving || classStudents.length === 0}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition text-xs"
                  >
                    Publish Roster Assessments
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Grade averages */}
          <div className="lg:col-span-4 space-y-6">
            {/* Class average */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-lg">
                <BarChart3 size={32} />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Class Average Score</p>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {classAvg}%
                </h2>
              </div>
            </div>

            {/* CAPS Grade Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Grade distribution</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span>Distinction (80 - 100)</span>
                  <span className="font-bold text-emerald-500">{dist.A} students</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit (70 - 79)</span>
                  <span className="font-bold text-amber-500">{dist.B} students</span>
                </div>
                <div className="flex justify-between">
                  <span>Pass (50 - 69)</span>
                  <span className="font-bold text-slate-300">{dist.C} students</span>
                </div>
                <div className="flex justify-between">
                  <span>Unsatisfactory (&lt; 50)</span>
                  <span className="font-bold text-red-500">{dist.F} students</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'class' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Class Assessment Sheet</h3>
              <p className="text-xs text-slate-500">Overview of all continuous assessment (Class) and terminal exam scores across all subjects.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#0d5c41] hover:bg-[#0b4a34] text-white font-semibold rounded text-xs transition"
            >
              Print Sheet
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 border border-slate-200 dark:border-slate-800" rowSpan={2}>Pupil Name</th>
                  {classSubjects.map(subj => (
                    <th key={subj.code} className="p-3 text-center border border-slate-200 dark:border-slate-800" colSpan={2}>
                      {subj.name} ({subj.code})
                    </th>
                  ))}
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800" rowSpan={2}>Overall Avg</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800" rowSpan={2}>Pos</th>
                </tr>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  {classSubjects.map(subj => (
                    <React.Fragment key={`${subj.code}-cols`}>
                      <th className="p-2 text-center text-[10px] border border-slate-200 dark:border-slate-800">Class</th>
                      <th className="p-2 text-center text-[10px] border border-slate-200 dark:border-slate-800">Exam</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {classSheetData.map(row => (
                  <tr key={row.student.id} className="text-slate-800 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
                      {row.student.first_name} {row.student.last_name}
                    </td>
                    {classSubjects.map(subj => {
                      const scoreInfo = row.subjects[subj.code] || { classScore: null, examScore: null };
                      return (
                        <React.Fragment key={`${row.student.id}-${subj.code}`}>
                          <td className="p-2 text-center border border-slate-200 dark:border-slate-800 font-mono">
                            {scoreInfo.classScore !== null ? scoreInfo.classScore : '-'}
                          </td>
                          <td className="p-2 text-center border border-slate-200 dark:border-slate-800 font-mono">
                            {scoreInfo.examScore !== null ? scoreInfo.examScore : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-[#0d5c41] dark:text-emerald-400 border border-slate-200 dark:border-slate-800">
                      {row.hasGrades ? `${row.overallAvg.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-500 border border-slate-200 dark:border-slate-800">
                      {row.position > 0 ? row.position : '-'}
                    </td>
                  </tr>
                ))}
                {classSheetData.length === 0 && (
                  <tr>
                    <td colSpan={classSubjects.length * 2 + 3} className="text-center py-6 text-slate-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subject' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Subject Assessment Sheet</h3>
              <p className="text-xs text-slate-500">Detailed continuous and terminal scores, scaled percentages, grades, and class rank for the selected subject.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#0d5c41] hover:bg-[#0b4a34] text-white font-semibold rounded text-xs transition"
            >
              Print Sheet
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-200 dark:border-slate-800">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-[10px] tracking-wider uppercase">
                  <th className="p-3 border border-slate-200 dark:border-slate-800">Pupil Name</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Class Score (100)</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Class Score (50%)</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Exam Score (100)</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Exam Score (50%)</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800 font-bold">Total Score (100%)</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Grade</th>
                  <th className="p-3 text-center border border-slate-200 dark:border-slate-800">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {subjectSheetData.map(row => {
                  const grade = row.hasGrade ? getRichGrade(row.total100) : null;
                  return (
                    <tr key={row.student.id} className="text-slate-800 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
                        {row.student.first_name} {row.student.last_name}
                      </td>
                      <td className="p-3 text-center border border-slate-200 dark:border-slate-800 font-mono">
                        {row.classScore !== null ? row.classScore : '-'}
                      </td>
                      <td className="p-3 text-center border border-slate-200 dark:border-slate-800 font-mono text-slate-500">
                        {row.class50 !== null ? row.class50.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center border border-slate-200 dark:border-slate-800 font-mono">
                        {row.examScore !== null ? row.examScore : '-'}
                      </td>
                      <td className="p-3 text-center border border-slate-200 dark:border-slate-800 font-mono text-slate-500">
                        {row.exam50 !== null ? row.exam50.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center font-bold border border-slate-200 dark:border-slate-800 font-mono text-[#0d5c41] dark:text-emerald-400">
                        {row.hasGrade ? row.total100.toFixed(1) : '-'}
                      </td>
                      <td className="p-3 text-center border border-slate-200 dark:border-slate-800">
                        {grade ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.total100 >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                            row.total100 >= 50 ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {grade.letter} ({grade.bece}) - {grade.remarks}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-500 border border-slate-200 dark:border-slate-800">
                        {row.position > 0 ? row.position : '-'}
                      </td>
                    </tr>
                  );
                })}
                {subjectSheetData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500">
                      No student assessments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
