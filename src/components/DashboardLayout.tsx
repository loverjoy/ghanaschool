import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Layers, CheckCircle, BarChart3, GraduationCap, 
  Wallet, FileText, Calendar, LogOut, Moon, Sun, Menu, X, Settings, 
  ShieldAlert, Sparkles, Building2, HelpCircle
} from 'lucide-react';

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: Array<'superadmin' | 'admin' | 'teacher'>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const { school } = useSchool(user?.school_id || null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('gsms_theme') as 'light' | 'dark') || 'dark'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Set theme class on DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('gsms_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinks: SidebarLink[] = [
    // SuperAdmin links
    { to: '/superadmin', label: 'MoE Control Hub', icon: <Building2 size={18} />, roles: ['superadmin'] },
    
    // Admin / Teacher links
    { to: '/dashboard', label: 'Overview', icon: <BarChart3 size={18} />, roles: ['admin', 'teacher'] },
    { to: '/students', label: 'Students Roster', icon: <Users size={18} />, roles: ['admin', 'teacher'] },
    { to: '/staff', label: 'Staff & Faculty', icon: <FileText size={18} />, roles: ['admin', 'teacher'] },
    { to: '/curriculum', label: 'Class & Curriculum', icon: <Layers size={18} />, roles: ['admin'] },
    { to: '/attendance', label: 'Weekly Attendance', icon: <CheckCircle size={18} />, roles: ['admin', 'teacher'] },
    { to: '/attendance-analytics', label: 'Attendance Stats', icon: <BarChart3 size={18} />, roles: ['admin', 'teacher'] },
    { to: '/assessments', label: 'Assessment ledger', icon: <BookOpen size={18} />, roles: ['admin', 'teacher'] },
    { to: '/question-bank', label: 'Question Bank', icon: <HelpCircle size={18} />, roles: ['admin', 'teacher'] },
    { to: '/promotions', label: 'Bulk Promotion', icon: <GraduationCap size={18} />, roles: ['admin'] },
    { to: '/timetable', label: 'Academic Timetables', icon: <Calendar size={18} />, roles: ['admin', 'teacher'] },
    { to: '/alumni', label: 'Alumni Directory', icon: <GraduationCap size={18} />, roles: ['admin', 'teacher'] },
    { to: '/payments', label: 'Tuition Fees', icon: <Wallet size={18} />, roles: ['admin'] },
    { to: '/leave', label: 'Leave Requests', icon: <FileText size={18} />, roles: ['admin', 'teacher'] },
    
    // Shared
    { to: '/settings', label: 'Settings', icon: <Settings size={18} />, roles: ['superadmin', 'admin', 'teacher'] },
  ];

  // Filter links by active user role
  const allowedLinks = navLinks.filter(link => user && link.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-lg">
            GS
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">GSMS</h1>
            <p className="text-[10px] text-amber-500 uppercase tracking-widest font-semibold">Ghana School SIS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {allowedLinks.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active 
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 border-l-4 border-amber-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition"
          >
            <LogOut size={14} />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside className="w-64 bg-white dark:bg-slate-900 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950">GS</div>
                <h1 className="text-sm font-bold">GSMS</h1>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {allowedLinks.map(link => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      active 
                        ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="p-1.5 md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm md:text-base font-bold tracking-tight text-slate-900 dark:text-white font-display truncate">
              {user?.role === 'superadmin' ? 'Ghana Ministry of Education System Panel' : school?.name || 'Loading Node...'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* School Stream Mode Display Badge */}
            {user?.role !== 'superadmin' && school && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles size={12} />
                {school.multi_stream_mode ? 'Multi-Stream' : 'Single-Stream'}
              </span>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
