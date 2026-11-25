import { useState, useEffect } from 'react';
import { School } from '../types';
import { apiFetch } from '../apiFetch';

export function useSchool(schoolId: string | null) {
  const [school, setSchool] = useState<School | null>(null);
  const [schoolsList, setSchoolsList] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchools = async () => {
    try {
      const data = await apiFetch('/api/data');
      if (data && data.schools) {
        setSchoolsList(data.schools);
        const current = data.schools.find((s: any) => s.id === schoolId || s.name === schoolId);
        setSchool(current || null);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [schoolId]);

  const updateSchoolSettings = async (settings: Partial<School>) => {
    try {
      const result = await apiFetch('/api/school-update', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      if (result && result.school) {
        setSchool(result.school);
        fetchSchools();
      }
    } catch (err) {
      console.error('Failed to update school settings:', err);
    }
  };

  const createSchool = async (schoolData: Omit<School, 'id' | 'createdAt'>) => {
    try {
      const result = await apiFetch('/api/school-register', {
        method: 'POST',
        body: JSON.stringify(schoolData)
      });
      fetchSchools();
      return result;
    } catch (err) {
      console.error('Failed to register school:', err);
      return null;
    }
  };

  return { school, schoolsList, loading, updateSchoolSettings, createSchool, refresh: fetchSchools };
}
