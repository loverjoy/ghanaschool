import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useStudents } from '../hooks/useStudents';
import { useTeachers } from '../hooks/useTeachers';
import { useLeave } from '../hooks/useLeave';
import { usePayments } from '../hooks/usePayments';
import { Users, FileText, Wallet, Calendar, Plus, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;
  
  const { school } = useSchool(schoolId);
  const { students } = useStudents(schoolId);
  const { teachers, assignments } = useTeachers(schoolId);
  const { leaveRequests, submitLeaveRequest, reviewLeaveRequest } = useLeave(schoolId);
  const { feePayments, feeTypes } = usePayments(schoolId);

  // Leave Form States (for Teacher)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveMsg, setLeaveMsg] = useState('');

  const activeStudents = students.filter(s => s.status === 'Active');
  
  // Calculate school-wide metrics (for Admin)
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  const totalCollectedFees = feePayments.reduce((acc, curr) => acc + curr.amount_paid, 0);

  // Calculate teacher-specific metrics (for Teacher)
  const teacherAssignments = assignments.filter(a => a.teacher_id === user?.id);
  const teacherClass = teacherAssignments.find(a => a.class_level_id && a.stream_id && !a.subject_id);
  const teacherSubjects = teacherAssignments.filter(a => a.subject_id);
  const myLeaves = leaveRequests.filter(l => l.teacher_id === user?.id);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate || !reason) return;
    
    await submitLeaveRequest(user.id, startDate, endDate, reason);
    setStartDate('');
    setEndDate('');
    setReason('');
    setLeaveMsg('Leave request submitted to school administration.');
    setTimeout(() => setLeaveMsg(''), 4000);
  };

  const handleReviewLeave = async (requestId: string, status: 'Approved' | 'Rejected') => {
    if (!user) return;
    await reviewLeaveRequest(requestId, status, user.id);
  };

  if (user?.role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Administrative Overview</h1>
          <p className="text-sm text-slate-500">{school?.name} — Control Center</p>
        </div>

        {/* Admin Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Enrollment</div>
              <div className="text-2xl font-bold mt-2">{activeStudents.length} Students</div>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><Users size={20} /></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Staff strength</div>
              <div className="text-2xl font-bold mt-2">{teachers.length} Teachers</div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><FileText size={20} /></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tuition Revenue</div>
              <div className="text-2xl font-bold mt-2">GHS {totalCollectedFees}</div>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Wallet size={20} /></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Leaves</div>
              <div className="text-2xl font-bold mt-2">{pendingLeaves.length} Requests</div>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-lg"><Calendar size={20} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Pending Leaves Approvals */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4">Leave Requests Approval Panel</h3>
              <div className="space-y-4">
                {pendingLeaves.map(req => {
                  const teacherName = teachers.find(t => t.id === req.teacher_id)?.name || 'Teacher';
                  return (
                    <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="font-semibold text-sm">{teacherName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Period: <strong>{req.start_date}</strong> to <strong>{req.end_date}</strong>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Reason: "{req.reason}"</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleReviewLeave(req.id, 'Approved')}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReviewLeave(req.id, 'Rejected')}
                          className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
                {pendingLeaves.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">No pending leave requests found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Recent activity details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4">Quick Links & Actions</h3>
              <div className="grid grid-cols-1 gap-2.5">
                <p className="text-xs text-slate-500 mb-2">Use the left navigation sidebar to access modules. Active settings:</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs space-y-1.5">
                  <p><strong>District Code:</strong> <code>{school?.code}</code></p>
                  <p><strong>Pass Mark:</strong> {school?.pass_mark}% score</p>
                  <p><strong>Region Scope:</strong> {school?.region}</p>
                  <p><strong>Syllabus Mode:</strong> {school?.multi_stream_mode ? 'A/B Stream Divisions' : 'Unified Stream Blocks'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher portal dashboard view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Teacher Portal</h1>
        <p className="text-sm text-slate-500">{school?.name} — Faculty Node</p>
      </div>

      {/* Teacher Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Class Assigned</div>
            <div className="text-xl font-bold mt-2 truncate">
              {teacherClass ? 'Class Teacher' : 'Subject Teacher Only'}
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg"><Users size={20} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Subjects Taught</div>
            <div className="text-2xl font-bold mt-2">{teacherSubjects.length} Courses</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg"><FileText size={20} /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">My Leave Approvals</div>
            <div className="text-2xl font-bold mt-2">
              {myLeaves.filter(l => l.status === 'Approved').length} / {myLeaves.length}
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg"><Calendar size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Leave Request Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-500">
              <Plus size={18} />
              Submit Leave Request
            </h3>

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-white outline-none resize-none"
                  placeholder="State the reason clearly..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {leaveMsg && (
                <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded p-2.5 text-center">
                  {leaveMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition text-xs"
              >
                Submit Leave Form
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List Leave Requests status */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4">My Leave History</h3>
            <div className="space-y-3">
              {myLeaves.map(req => (
                <div key={req.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold">{req.reason}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Period: {req.start_date} to {req.end_date}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                    req.status === 'Rejected' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
              {myLeaves.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-6">No leave history found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
