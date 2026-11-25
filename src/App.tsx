import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import StudentsPage from './pages/StudentsPage';
import StaffPage from './pages/StaffPage';
import ClassCurriculumPage from './pages/ClassCurriculumPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceAnalyticsPage from './pages/AttendanceAnalyticsPage';
import AssessmentsPage from './pages/AssessmentsPage';
import QuestionBankPage from './pages/QuestionBankPage';
import PromotionPage from './pages/PromotionPage';
import TimetablePage from './pages/TimetablePage';
import AlumniPage from './pages/AlumniPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import { ShieldAlert } from 'lucide-react';

// Route Guard to verify auth and role policies
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles?: Array<'superadmin' | 'admin' | 'teacher'> 
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-sm font-semibold tracking-wider animate-pulse">Loading GSMS Partition...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500" />
          <h3 className="text-lg font-bold">Access Denied</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Your account profile (role: <strong>{user.role}</strong>) does not have authorization to view this module.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Wrap allowed pages in global Sidebar Layout
  return <DashboardLayout>{children}</DashboardLayout>;
}

// Redirects logged in users away from Login page
function LoginRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Login */}
          <Route path="/login" element={<LoginRoute />} />

          {/* SuperAdmin specific */}
          <Route path="/superadmin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          {/* School-level dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <SchoolAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <StudentsPage />
            </ProtectedRoute>
          } />

          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <StaffPage />
            </ProtectedRoute>
          } />

          <Route path="/curriculum" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClassCurriculumPage />
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AttendancePage />
            </ProtectedRoute>
          } />

          <Route path="/attendance-analytics" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AttendanceAnalyticsPage />
            </ProtectedRoute>
          } />

          <Route path="/assessments" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AssessmentsPage />
            </ProtectedRoute>
          } />

          <Route path="/question-bank" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <QuestionBankPage />
            </ProtectedRoute>
          } />

          <Route path="/promotions" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PromotionPage />
            </ProtectedRoute>
          } />

          <Route path="/timetable" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <TimetablePage />
            </ProtectedRoute>
          } />

          <Route path="/alumni" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AlumniPage />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PaymentsPage />
            </ProtectedRoute>
          } />

          <Route path="/leave" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leave Requests history</h1>
                  <p className="text-sm text-slate-500">Leave forms and approvals are integrated directly on your main dashboard.</p>
                </div>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin', 'teacher']}>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
