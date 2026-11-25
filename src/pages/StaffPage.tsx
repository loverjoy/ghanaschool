import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useTeachers } from '../hooks/useTeachers';
import { Plus, Trash2, Key, Users, BookOpen } from 'lucide-react';

export default function StaffPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams, subjects } = useClassLevels(schoolId);
  const { teachers, assignments, addTeacher, assignClassTeacher, assignSubjectTeacher, removeAssignment } = useTeachers(schoolId);

  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  React.useEffect(() => {
    if (user?.role === 'teacher') {
      const getProfile = async () => {
        try {
          const res = await fetch('/api/data');
          if (res.ok) {
            const db = await res.json();
            const matched = db.teachers.find((t: any) => t.email.toLowerCase() === user.email.toLowerCase());
            setTeacherProfile(matched || null);
          }
        } catch (e) {
          console.error(e);
        }
      };
      getProfile();
    }
  }, [user]);

  // Form States: Teacher Creation
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Tutor');
  const [createMsg, setCreateMsg] = useState({ text: '', type: '' });

  // Form States: Class Teacher Assignment
  const [ctTeacherId, setCtTeacherId] = useState('');
  const [ctClassId, setCtClassId] = useState('');
  const [ctStreamId, setCtStreamId] = useState('');
  const [ctYear, setCtYear] = useState('2025/2026');
  const [ctMsg, setCtMsg] = useState({ text: '', type: '' });

  // Form States: Subject Teacher Assignment
  const [stTeacherId, setStTeacherId] = useState('');
  const [stClassId, setStClassId] = useState('');
  const [stStreamId, setStStreamId] = useState('');
  const [stSubjectId, setStSubjectId] = useState('');
  const [stYear, setStYear] = useState('2025/2026');
  const [stMsg, setStMsg] = useState({ text: '', type: '' });

  // Set default selections
  React.useEffect(() => {
    if (teachers.length > 0) {
      setCtTeacherId(teachers[0].id);
      setStTeacherId(teachers[0].id);
    }
    if (classLevels.length > 0) {
      setCtClassId(classLevels[0].id);
      setStClassId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setCtStreamId(streams[0].id);
      setStStreamId(streams[0].id);
    }
  }, [teachers, classLevels, streams]);

  // Adjust Subject dropdown options based on selected class
  const classSubjects = subjects.filter(s => {
    // Server stores subjects by `applicableLevels` (no `class_level_id` field on records).
    return (s.applicableLevels || []).includes(stClassId as any) || s.class_level_id === stClassId;
  });
  React.useEffect(() => {
    if (classSubjects.length > 0) {
      setStSubjectId(classSubjects[0].id);
    } else {
      setStSubjectId('');
    }
  }, [stClassId, subjects]);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const { error } = await addTeacher(name, email, designation);
    if (error) {
      setCreateMsg({ text: error.message, type: 'danger' });
    } else {
      setName('');
      setEmail('');
      setCreateMsg({ text: 'Teacher account provisioned.', type: 'success' });
    }
    setTimeout(() => setCreateMsg({ text: '', type: '' }), 4000);
  };

  const handleAssignClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctTeacherId || !ctClassId || !ctYear) return;

    const { error } = await assignClassTeacher(
      ctTeacherId,
      ctClassId,
      school?.multi_stream_mode ? ctStreamId : null,
      ctYear
    );

    if (error) {
      setCtMsg({ text: error.message, type: 'danger' });
    } else {
      setCtMsg({ text: 'Class Teacher assigned.', type: 'success' });
    }
    setTimeout(() => setCtMsg({ text: '', type: '' }), 4000);
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stTeacherId || !stClassId || !stSubjectId || !stYear) return;

    const { error } = await assignSubjectTeacher(
      stTeacherId,
      stClassId,
      school?.multi_stream_mode ? stStreamId : null,
      stSubjectId,
      stYear
    );

    if (error) {
      setStMsg({ text: error.message, type: 'danger' });
    } else {
      setStMsg({ text: 'Subject Teacher assigned.', type: 'success' });
    }
    setTimeout(() => setStMsg({ text: '', type: '' }), 4000);
  };

  if (user?.role === 'teacher') {
    // Teacher portal: View their own profile and assignments
    const myAssignments = assignments.filter(a => a.teacher_id === user.id);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">My Portal Profile</h1>
          <p className="text-sm text-slate-500">Your profile details and registered schedules in the district node directory.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0d5c41]">My Staff Profile</h3>
          {teacherProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Registration Code</span>
                <strong className="text-slate-900 dark:text-white font-mono">{teacherProfile.registrationCode || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Core Subject</span>
                <strong className="text-slate-900 dark:text-white">{teacherProfile.subject || 'General'}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Qualification</span>
                <strong className="text-slate-900 dark:text-white">{teacherProfile.qualification || 'Tutor'}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Contact Phone</span>
                <strong className="text-slate-900 dark:text-white">{teacherProfile.phone || 'N/A'}</strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850 sm:col-span-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Homeroom Class (Class Teacher)</span>
                <strong className="text-slate-900 dark:text-white">
                  {teacherProfile.isClassTeacher && teacherProfile.homeroomClass 
                    ? `Class Teacher of ${teacherProfile.homeroomClass.classLevel} ${teacherProfile.homeroomClass.stream}`
                    : 'No class homeroom assigned'
                  }
                </strong>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-850 sm:col-span-2">
                <span className="text-slate-400 font-semibold block uppercase text-[10px] tracking-wider mb-1">Email Profile</span>
                <strong className="text-slate-900 dark:text-white">{teacherProfile.email}</strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Loading profile details...</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0d5c41]">My Academic Assignments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAssignments.map((asg) => {
              const classLevelName = classLevels.find(c => c.id === asg.class_level_id)?.name || 'JHS';
              const streamName = school?.multi_stream_mode ? streams.find(s => s.id === asg.stream_id)?.name || '' : '';
              const subjectName = asg.subject_id ? subjects.find(s => s.id === asg.subject_id || s.code === asg.subject_id)?.name : null;

              return (
                <div key={asg.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
                    {subjectName ? <BookOpen size={20} /> : <Users size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {subjectName ? `${subjectName} Teacher` : 'Class Teacher'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class: <strong>{classLevelName} {streamName}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">Year: {asg.academic_year}</p>
                  </div>
                </div>
              );
            })}
            {myAssignments.length === 0 && (
              <p className="text-sm text-slate-500 col-span-2 text-center py-6">No assignments scheduled yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Faculty & Staff Directories</h1>
        <p className="text-sm text-slate-500">Manage teacher profiles and configure class and subject mappings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Mappings & add teacher Forms */}
        <div className="lg:col-span-5 space-y-6">
          {/* Create Teacher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
              <Plus size={16} /> Add Teacher Profile
            </h3>

            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Ama Serwaa"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="Tutor"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@accrahigh.edu.gh"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {createMsg.text && (
                <div className={`text-xs p-2.5 rounded text-center border ${
                  createMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {createMsg.text}
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs">
                Add Teacher
              </button>
            </form>
          </div>

          {/* Class Teacher Assignment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
              <Plus size={16} /> Assign Class Teacher
            </h3>

            <form onSubmit={handleAssignClass} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Select Teacher</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={ctTeacherId}
                    onChange={(e) => setCtTeacherId(e.target.value)}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Class Level</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={ctClassId}
                    onChange={(e) => setCtClassId(e.target.value)}
                  >
                    {classLevels.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {school?.multi_stream_mode && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stream</label>
                    <select
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={ctStreamId}
                      onChange={(e) => setCtStreamId(e.target.value)}
                    >
                      {streams.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={ctYear}
                    onChange={(e) => setCtYear(e.target.value)}
                  />
                </div>
              </div>

              {ctMsg.text && (
                <div className={`text-xs p-2.5 rounded text-center border ${
                  ctMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {ctMsg.text}
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs">
                Assign Class Teacher
              </button>
            </form>
          </div>

          {/* Subject Teacher Assignment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
              <Plus size={16} /> Assign Subject Teacher
            </h3>

            <form onSubmit={handleAssignSubject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Select Teacher</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={stTeacherId}
                    onChange={(e) => setStTeacherId(e.target.value)}
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Class Level</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={stClassId}
                    onChange={(e) => setStClassId(e.target.value)}
                  >
                    {classLevels.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {school?.multi_stream_mode && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stream</label>
                    <select
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                      value={stStreamId}
                      onChange={(e) => setStStreamId(e.target.value)}
                    >
                      {streams.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className={school?.multi_stream_mode ? 'col-span-1' : 'col-span-2'}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={stSubjectId}
                    onChange={(e) => setStSubjectId(e.target.value)}
                  >
                    {classSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Year</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={stYear}
                    onChange={(e) => setStYear(e.target.value)}
                  />
                </div>
              </div>

              {stMsg.text && (
                <div className={`text-xs p-2.5 rounded text-center border ${
                  stMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {stMsg.text}
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs">
                Assign Subject Teacher
              </button>
            </form>
          </div>
        </div>

        {/* Right column: List Assignments */}
        <div className="lg:col-span-7 space-y-6">
          {/* Faculty Assignment List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4">Faculty Assignments Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Tutor Name</th>
                    <th className="pb-3">Role / Subject</th>
                    <th className="pb-3">Class Scope</th>
                    <th className="pb-3">Academic Year</th>
                    <th className="pb-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {assignments.map((asg) => {
                    const teacher = teachers.find(t => t.id === asg.teacher_id);
                    const classLevel = classLevels.find(c => c.id === asg.class_level_id)?.name || '';
                    const stream = school?.multi_stream_mode ? streams.find(s => s.id === asg.stream_id)?.name || '' : '';
                    const subjectName = asg.subject_id ? subjects.find(s => s.id === asg.subject_id || s.code === asg.subject_id)?.name : null;

                    return (
                      <tr key={asg.id} className="text-slate-800 dark:text-slate-300">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {teacher?.name || 'Unassigned'}
                        </td>
                        <td className="py-3">
                          {subjectName ? (
                            <span className="text-blue-500 font-medium">{subjectName} Teacher</span>
                          ) : (
                            <span className="text-amber-500 font-semibold">Class Teacher</span>
                          )}
                        </td>
                        <td className="py-3">{classLevel} {stream}</td>
                        <td className="py-3">{asg.academic_year}</td>
                        <td className="py-3">
                          <button
                            onClick={() => removeAssignment(asg.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-500">
                        No assignments mapped yet in faculty directories.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
