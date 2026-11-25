import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { Student, StudentStatus } from '../types';
import { useAssessments } from '../hooks/useAssessments';
import { Search, Plus, Eye, Edit2, ShieldAlert, HeartPulse, FileText, Printer, X } from 'lucide-react';
import jsPDF from 'jspdf';

export default function StudentsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams, subjects } = useClassLevels(schoolId);
  const { students, addStudent, updateStudent } = useStudents(schoolId);
  const { assessments } = useAssessments(schoolId);

  // Report Card States
  const [reportStudent, setReportStudent] = useState<Student | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>('Term 1');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('2013-01-01');
  const [classLevelId, setClassLevelId] = useState('');
  const [streamId, setStreamId] = useState('');
  const [ghanaId, setGhanaId] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  const [formMsg, setFormMsg] = useState({ text: '', type: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Editing modal states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editStatus, setEditStatus] = useState<StudentStatus>('Active');
  const [editClassId, setEditClassId] = useState('');
  const [editStreamId, setEditStreamId] = useState('');

  // Initial Form Selection Setup
  React.useEffect(() => {
    if (classLevels.length > 0) {
      setClassLevelId(classLevels[0].id);
    }
    if (streams.length > 0) {
      setStreamId(streams[0].id);
    }
  }, [classLevels, streams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !ghanaId || !emergencyName || !emergencyPhone) {
      setFormMsg({ text: 'All demographic credentials and emergency contacts are required.', type: 'danger' });
      return;
    }

    const ghaRegex = /^GHA-\d{9}-\d$/;
    if (!ghaRegex.test(ghanaId)) {
      setFormMsg({
        text: 'Invalid Ghana National ID Format. Must match standard: GHA-XXXXXXXXX-X (e.g. GHA-123456789-2)',
        type: 'danger'
      });
      return;
    }

    await addStudent({
      first_name: firstName,
      last_name: lastName,
      gender,
      dob,
      class_level_id: classLevelId,
      stream_id: school?.multi_stream_mode ? streamId : null,
      ghana_id: ghanaId,
      medical_info: medicalInfo || 'None',
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      status: 'Active'
    });

    setFirstName('');
    setLastName('');
    setGhanaId('');
    setMedicalInfo('');
    setEmergencyName('');
    setEmergencyPhone('');
    setFormMsg({ text: 'Student profile registered successfully.', type: 'success' });
    setTimeout(() => setFormMsg({ text: '', type: '' }), 4000);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditStatus(student.status);
    setEditClassId(student.class_level_id);
    setEditStreamId(student.stream_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    const saved = await updateStudent(editingStudent.id, {
      status: editStatus,
      class_level_id: editClassId,
      stream_id: school?.multi_stream_mode ? editStreamId : null
    });
    if (saved) {
      setEditingStudent(null);
    } else {
      setFormMsg({ text: 'Failed to save changes — the record may have changed. Please try again.', type: 'danger' });
    }
  };

  // Search and Filter Logic
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || (student.ghana_id || '').includes(searchTerm);
    const matchClass = filterClass ? student.class_level_id === filterClass : true;
    const matchStatus = filterStatus ? student.status === filterStatus : true;
    return matchSearch && matchClass && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Student Roster Management</h1>
        <p className="text-sm text-slate-500">Register demographics, verify National IDs, and track enrolment streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Register Student Form */}
        {user?.role === 'admin' && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-500">
                <Plus size={18} />
                Enroll Student
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Yao"
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Osei"
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gender</label>
                    <select
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Class Level</label>
                    <select
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={classLevelId}
                      onChange={(e) => setClassLevelId(e.target.value)}
                    >
                      {classLevels.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {school?.multi_stream_mode && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stream</label>
                      <select
                        className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                        value={streamId}
                        onChange={(e) => setStreamId(e.target.value)}
                      >
                        {streams.map(strm => (
                          <option key={strm.id} value={strm.id}>{strm.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Ghana ID (National Card)</label>
                  <input
                    type="text"
                    required
                    placeholder="GHA-789012345-1"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    value={ghanaId}
                    onChange={(e) => setGhanaId(e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Format: GHA-XXXXXXXXX-X</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Asthma, allergies (optional)"
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    value={medicalInfo}
                    onChange={(e) => setMedicalInfo(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Emergency contact</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Isaac Osei"
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Emergency Mobile</label>
                    <input
                      type="text"
                      required
                      placeholder="+233 24 000 0000"
                      className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                    />
                  </div>
                </div>

                {formMsg.text && (
                  <div className={`text-xs p-2.5 rounded text-center border ${
                    formMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                  }`}>
                    {formMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition text-xs"
                >
                  Verify Ghana Card & Enroll
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Right Side: Filters & Listing */}
        <div className={`${user?.role === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            {/* Search/Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search students by name or Ghana ID..."
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
              </div>

              <select
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classLevels.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Graduated">Graduated</option>
                <option value="Repeated">Repeated</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Pupil Name</th>
                    <th className="pb-3">Class/Stream</th>
                    <th className="pb-3">Ghana Card ID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Medical / Emergency</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStudents.map((student) => {
                    const classLevel = classLevels.find(c => c.id === student.class_level_id)?.name || 'JHS';
                    const stream = school?.multi_stream_mode ? streams.find(s => s.id === student.stream_id)?.name || '' : '';
                    
                    return (
                      <tr key={student.id} className="text-slate-800 dark:text-slate-300">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="py-3">
                          {classLevel} {stream}
                        </td>
                        <td className="py-3">
                          <code>{student.ghana_id || 'N/A'}</code>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            student.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                            student.status === 'Graduated' ? 'bg-blue-500/10 text-blue-500' :
                            student.status === 'Repeated' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <HeartPulse size={10} color="var(--destructive)" />
                            <span className="truncate max-w-[120px]" title={student.medical_info}>{student.medical_info}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Cont: {student.emergency_contact_name} ({student.emergency_contact_phone})
                          </div>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {(user?.role === 'admin' || user?.role === 'superadmin' || (user?.isClassTeacher && user?.homeroomClass && student.class_level_id === user.homeroomClass.classLevel && (!school?.multi_stream_mode || student.stream_id === user.homeroomClass.stream))) && (
                            <button
                              onClick={() => setReportStudent(student)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#0d5c41] rounded inline-flex items-center"
                              title="Terminal Report Card"
                            >
                              <FileText size={13} />
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white rounded inline-flex items-center"
                              title="Edit Enrolment"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-500">
                        No students match the active filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Enrolment: {editingStudent.first_name} {editingStudent.last_name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Enrolment Status
                </label>
                <select
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="Active">Active</option>
                  <option value="Graduated">Graduated</option>
                  <option value="Repeated">Repeated</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Class Level
                </label>
                <select
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                >
                  {classLevels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {school?.multi_stream_mode && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Stream
                  </label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={editStreamId}
                    onChange={(e) => setEditStreamId(e.target.value)}
                  >
                    {streams.map(strm => (
                      <option key={strm.id} value={strm.id}>{strm.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold rounded transition"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Card Modal */}
      {reportStudent && (() => {
        const studentAsms = assessments.filter(a => 
          a.student_id === reportStudent.id && 
          a.term === selectedTerm && 
          a.academic_year === `${selectedYear}/${Number(selectedYear)+1}`
        );

        let weightedSum = 0;
        studentAsms.forEach(a => {
          weightedSum += (0.3 * Number(a.class_score || 0)) + (0.7 * Number(a.exam_score || 0));
        });
        const termAverage = studentAsms.length > 0 ? weightedSum / studentAsms.length : 0;
        
        // Dynamic position in class calculator
        const classStudents = students.filter(s => s.class_level_id === reportStudent.class_level_id && s.status === 'Active');
        const averagesList = classStudents.map(student => {
          const studentAsmsAll = assessments.filter(a => 
            a.student_id === student.id && 
            a.term === selectedTerm && 
            a.academic_year === `${selectedYear}/${Number(selectedYear)+1}`
          );

          if (studentAsmsAll.length === 0) return { studentId: student.id, avg: 0 };

          let weightedSumAll = 0;
          studentAsmsAll.forEach(a => {
            weightedSumAll += (0.3 * Number(a.class_score || 0)) + (0.7 * Number(a.exam_score || 0));
          });
          const avg = weightedSumAll / studentAsmsAll.length;
          return { studentId: student.id, avg };
        });

        averagesList.sort((a, b) => b.avg - a.avg);
        const rank = averagesList.findIndex(x => x.studentId === reportStudent.id);
        const displayRank = rank !== -1 ? rank + 1 : 1;
        const positionInfo = `${displayRank} of ${classStudents.length}`;

        // Get Grade code based on WAEC basic education scale
        const getGrade = (score: number) => {
          if (score >= 80) return 'A1';
          if (score >= 75) return 'B2';
          if (score >= 70) return 'B3';
          if (score >= 65) return 'C4';
          if (score >= 60) return 'C5';
          if (score >= 55) return 'C6';
          if (score >= 50) return 'D7';
          if (score >= 40) return 'E8';
          return 'F9';
        };

        const getRemarks = (score: number) => {
          if (score >= 80) return 'Excellent';
          if (score >= 70) return 'Very Good';
          if (score >= 60) return 'Good';
          if (score >= 50) return 'Pass';
          return 'Fail';
        };

        const handlePrintReport = () => {
          const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter'
          });

          // Outer border
          doc.setLineWidth(0.02);
          doc.setDrawColor(13, 92, 65); // Forest green
          doc.rect(0.4, 0.4, 7.7, 10.2);

          // Header
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(13, 92, 65);
          doc.text('REPUBLIC OF GHANA - MINISTRY OF EDUCATION', 4.25, 0.9, { align: 'center' });

          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42);
          doc.text(school?.name || 'GHANA SCHOOL SYSTEM', 4.25, 1.25, { align: 'center' });

          doc.setFontSize(12);
          doc.setFont('Helvetica', 'normal');
          doc.text('OFFICIAL ACADEMIC REPORT CARD', 4.25, 1.55, { align: 'center' });

          // Decorative line
          doc.setLineWidth(0.015);
          doc.setDrawColor(217, 119, 6); // Amber
          doc.line(0.8, 1.7, 7.7, 1.7);

          // Student Demographics details
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          doc.text('STUDENT INFORMATION', 0.8, 2.0);
          doc.line(0.8, 2.05, 2.5, 2.05);

          doc.setFont('Helvetica', 'normal');
          doc.text(`Pupil Name: ${reportStudent.first_name} ${reportStudent.last_name}`, 0.8, 2.3);
          doc.text(`Student ID: ${reportStudent.studentId}`, 0.8, 2.5);
          const lvlName = classLevels.find(c => c.id === reportStudent.class_level_id)?.name || reportStudent.class_level_id;
          const strmName = school?.multiStreamMode ? streams.find(s => s.id === reportStudent.stream_id)?.name || reportStudent.stream_id : '';
          doc.text(`Class: ${lvlName} ${strmName}`, 0.8, 2.7);

          doc.text(`Academic Year: ${selectedYear}/${Number(selectedYear)+1}`, 4.5, 2.3);
          doc.text(`Term: ${selectedTerm}`, 4.5, 2.5);
          doc.text(`Ghana Card ID: ${reportStudent.ghana_id || 'N/A'}`, 4.5, 2.7);

          // Table Headers
          const startY = 3.2;
          doc.setFillColor(13, 92, 65);
          doc.rect(0.8, startY, 6.9, 0.3, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('Subject', 0.9, startY + 0.2);
          doc.text('Class (30%)', 2.8, startY + 0.2);
          doc.text('Exam (70%)', 4.0, startY + 0.2);
          doc.text('Combined', 5.1, startY + 0.2);
          doc.text('Grade', 6.2, startY + 0.2);
          doc.text('Remarks', 7.0, startY + 0.2);

          // Grid details
          let currentY = startY + 0.3;
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(15, 23, 42);

          studentAsms.forEach((asm, index) => {
            // Alternate background colors
            if (index % 2 === 1) {
              doc.setFillColor(248, 250, 252);
              doc.rect(0.8, currentY, 6.9, 0.25, 'F');
            }

            // Draw border
            doc.setLineWidth(0.005);
            doc.setDrawColor(203, 213, 225);
            doc.rect(0.8, currentY, 6.9, 0.25);

            const subjName = subjects.find(s => s.code === asm.subject_id)?.name || asm.subject_id;
            doc.text(String(subjName).substring(0, 24), 0.9, currentY + 0.17);
            doc.text(String(asm.class_score), 3.0, currentY + 0.17);
            doc.text(String(asm.exam_score), 4.2, currentY + 0.17);
            
            const combined = (0.3 * Number(asm.class_score)) + (0.7 * Number(asm.exam_score));
            doc.text(combined.toFixed(1), 5.3, currentY + 0.17);
            doc.text(getGrade(combined), 6.3, currentY + 0.17);
            doc.text(getRemarks(combined), 7.1, currentY + 0.17);

            currentY += 0.25;
          });

          // Summary Box
          currentY += 0.3;
          doc.setFillColor(241, 245, 249);
          doc.rect(0.8, currentY, 6.9, 0.95, 'F');
          doc.setLineWidth(0.01);
          doc.setDrawColor(203, 213, 225);
          doc.rect(0.8, currentY, 6.9, 0.95);

          doc.setFont('Helvetica', 'bold');
          doc.text('OVERALL ACADEMIC SUMMARY', 1.0, currentY + 0.25);
          doc.setFont('Helvetica', 'normal');
          doc.text(`Total Subjects Registered: ${studentAsms.length}`, 1.0, currentY + 0.5);
          doc.text(`Position in Class: ${positionInfo}`, 1.0, currentY + 0.75);

          doc.text(`Term Average: ${termAverage.toFixed(2)}%`, 4.5, currentY + 0.5);
          const passLimit = school?.passMark || 50;
          const passes = termAverage >= passLimit;
          doc.setFont('Helvetica', 'bold');
          doc.text(`Status: ${passes ? 'PASS' : 'FAIL'}`, 4.5, currentY + 0.75);

          // Signatures
          currentY += 1.4;
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.line(0.8, currentY, 2.8, currentY);
          doc.text('Class Teacher Signature', 0.8, currentY + 0.2);

          doc.line(5.7, currentY, 7.7, currentY);
          doc.text('Headmaster Signature', 5.7, currentY + 0.2);

          // Stamp
          doc.setLineWidth(0.015);
          doc.setDrawColor(13, 92, 65, 0.5);
          doc.rect(3.5, currentY - 0.4, 1.5, 0.6);
          doc.setFontSize(8);
          doc.text('OFFICIAL STAMP', 4.25, currentY - 0.1, { align: 'center' });

          doc.save(`report_card_${reportStudent.studentId}_${selectedTerm.replace(' ', '')}.pdf`);
        };

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setReportStudent(null)}
                className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700"
              >
                <X size={18} />
              </button>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-[#0d5c41]" size={20} />
                  Terminal Academic Report Card
                </h3>
                <p className="text-xs text-slate-500">Generate and review continuous assessment terminal sheets.</p>
              </div>

              {/* Filters / Parameters */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-850 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Select Term</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded p-1.5 outline-none font-medium text-slate-800 dark:text-slate-200"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value as any)}
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Academic Year</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded p-1.5 outline-none font-medium text-slate-800 dark:text-slate-200"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="2025">2025/2026</option>
                    <option value="2026">2026/2027</option>
                  </select>
                </div>
              </div>

              {/* Student Demographics Info */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-lg text-xs grid grid-cols-2 gap-y-1.5 gap-x-4">
                <p><span className="text-slate-400 font-medium">Pupil:</span> <strong className="text-slate-850 dark:text-white">{reportStudent.first_name} {reportStudent.last_name}</strong></p>
                <p><span className="text-slate-400 font-medium">Student ID:</span> <code>{reportStudent.studentId}</code></p>
                <p><span className="text-slate-400 font-medium">Class:</span> <strong>{classLevels.find(c => c.id === reportStudent.class_level_id)?.name} {school?.multiStreamMode ? streams.find(s => s.id === reportStudent.stream_id)?.name : ''}</strong></p>
                <p><span className="text-slate-400 font-medium">Ghana Card ID:</span> <code>{reportStudent.ghana_id || 'N/A'}</code></p>
              </div>

              {/* Grades Listing */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                      <th className="p-2">Subject</th>
                      <th className="p-2 text-center">Class (30%)</th>
                      <th className="p-2 text-center">Exam (70%)</th>
                      <th className="p-2 text-center">Combined</th>
                      <th className="p-2 text-center">Grade</th>
                      <th className="p-2 text-center">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {studentAsms.map((asm) => {
                      const subjName = subjects.find(s => s.code === asm.subject_id)?.name || asm.subject_id;
                      const combined = (0.3 * Number(asm.class_score)) + (0.7 * Number(asm.exam_score));

                      return (
                        <tr key={asm.id} className="text-slate-700 dark:text-slate-300">
                          <td className="p-2 font-semibold text-slate-900 dark:text-white">{subjName}</td>
                          <td className="p-2 text-center">{asm.class_score}</td>
                          <td className="p-2 text-center">{asm.exam_score}</td>
                          <td className="p-2 text-center font-bold text-[#0d5c41]">{combined.toFixed(1)}</td>
                          <td className="p-2 text-center font-semibold">{getGrade(combined)}</td>
                          <td className="p-2 text-center text-[10px] font-medium text-slate-500">{getRemarks(combined)}</td>
                        </tr>
                      );
                    })}
                    {studentAsms.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-slate-500">
                          No assessment marks logged for this term and academic year.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Overall Summary Summary */}
              {studentAsms.length > 0 && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium">Position in Class:</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{positionInfo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 font-medium">Term Average:</p>
                    <p className="text-sm font-bold text-[#0d5c41]">{termAverage.toFixed(2)}%</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => setReportStudent(null)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Close
                </button>
                {studentAsms.length > 0 && (
                  <button 
                    onClick={handlePrintReport}
                    className="px-3.5 py-1.5 bg-[#0d5c41] hover:bg-[#0a4632] text-white text-xs font-semibold rounded transition flex items-center gap-1.5"
                  >
                    <Printer size={13} />
                    Print Report Card (PDF)
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
