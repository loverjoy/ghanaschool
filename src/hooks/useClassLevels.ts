import { useState, useEffect } from 'react';
import { ClassLevel, Stream, Subject } from '../types';
import { apiFetch } from '../apiFetch';

const fixedLevels: any[] = [
  { id: 'KG1', name: 'KG1', sort_order: 1, is_terminal: false },
  { id: 'KG2', name: 'KG2', sort_order: 2, is_terminal: false },
  { id: 'Primary 1', name: 'Primary 1', sort_order: 3, is_terminal: false },
  { id: 'Primary 2', name: 'Primary 2', sort_order: 4, is_terminal: false },
  { id: 'Primary 3', name: 'Primary 3', sort_order: 5, is_terminal: false },
  { id: 'Primary 4', name: 'Primary 4', sort_order: 6, is_terminal: false },
  { id: 'Primary 5', name: 'Primary 5', sort_order: 7, is_terminal: false },
  { id: 'Primary 6', name: 'Primary 6', sort_order: 8, is_terminal: false },
  { id: 'JHS 1', name: 'JHS 1', sort_order: 9, is_terminal: false },
  { id: 'JHS 2', name: 'JHS 2', sort_order: 10, is_terminal: false },
  { id: 'JHS 3', name: 'JHS 3', sort_order: 11, is_terminal: true },
];

export function useClassLevels(schoolId: string | null) {
  const [classLevels, setClassLevels] = useState<any[]>(fixedLevels);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/data');
      if (data) {
        // Stream data: extract from students/timetable/teachers
        const schoolStudents = data.students.filter((s: any) => s.schoolName === schoolId);
        const uniqueStreams = Array.from(new Set(schoolStudents.map((s: any) => s.stream).filter(Boolean)));
        
        // If empty, default to ["A", "B"]
        const streamsList = uniqueStreams.length > 0 
          ? uniqueStreams.map(name => ({ id: name, name })) 
          : [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }];

        setStreams(streamsList);
        
        // Subjects for school
        const schoolSubjects = data.subjects.filter((s: any) => s.schoolName === schoolId);
        setSubjects(schoolSubjects);
      }
    } catch (err) {
      console.error('Failed to fetch class level configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const addClassLevel = async (name: string, sortOrder: number, isTerminal: boolean) => {
    // Class levels are fixed, no-op
  };

  const addStream = async (name: string) => {
    // Dynamic stream addition can update local list or no-op
    setStreams(prev => [...prev.filter(s => s.id !== name), { id: name, name }]);
  };

  const addSubject = async (classLevelId: string, name: string, code: string) => {
    try {
      await apiFetch('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          applicableLevels: [classLevelId]
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add subject:', err);
    }
  };

  return { classLevels, streams, subjects, loading, addClassLevel, addStream, addSubject, refresh: fetchData };
}
