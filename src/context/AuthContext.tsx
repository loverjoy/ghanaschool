import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const sessionStr = localStorage.getItem('gsms_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.user) {
          // Re-fetch all system state from database
          const res = await fetch('/api/data');
          if (res.ok) {
            const allDb = await res.json();
            const latestUser = allDb.users.find((u: any) => u.id === session.user.id);
            if (latestUser) {
              let u = { ...latestUser, school_id: latestUser.schoolName || null };
              if (latestUser.role === 'teacher') {
                const teacherRecord = allDb.teachers.find((t: any) => t.email.toLowerCase() === latestUser.email.toLowerCase());
                if (teacherRecord) {
                  u = {
                    ...u,
                    isClassTeacher: !!teacherRecord.isClassTeacher,
                    homeroomClass: teacherRecord.homeroomClass || null
                  };
                }
              }
              setUser(u);
              localStorage.setItem('gsms_session', JSON.stringify({ user: u }));
            } else {
              setUser({ ...session.user, school_id: session.user.schoolName || null });
            }
          } else {
            setUser({ ...session.user, school_id: session.user.schoolName || null });
          }
        }
      } catch (e) {
        console.error('Failed to parse cached session:', e);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (username: string, password = 'password') => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();
      if (result.success) {
        const u = { ...result.user, school_id: result.user.schoolName || null };
        setUser(u);
        localStorage.setItem('gsms_session', JSON.stringify({ user: u }));
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed.' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Server connection error.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('gsms_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
