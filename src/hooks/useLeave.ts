import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

export function useLeave(schoolId: string | null) {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch('/api/data');
      if (data && data.leaveRequests) {
        const schoolLeaves = data.leaveRequests.filter((l: any) => l.schoolName === schoolId);
        
        // Map to backward compatible structures
        const mapped = schoolLeaves.map((l: any) => ({
          id: l.id,
          school_id: schoolId,
          teacher_id: l.teacherId,
          start_date: l.startDate,
          end_date: l.endDate,
          reason: l.reason,
          status: l.status,
          approved_by: l.approvedBy
        }));

        setLeaveRequests(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [schoolId]);

  const submitLeaveRequest = async (teacherId: string, startDate: string, endDate: string, reason: string) => {
    if (!schoolId) return;
    try {
      await apiFetch('/api/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          teacherId,
          startDate,
          endDate,
          reason,
          status: 'Pending',
          approvedBy: null
        })
      });
      fetchLeaves();
    } catch (err) {
      console.error('Failed to submit leave request:', err);
    }
  };

  const reviewLeaveRequest = async (requestId: string, status: 'Approved' | 'Rejected', adminId: string) => {
    try {
      await apiFetch(`/api/leave-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          approvedBy: adminId
        })
      });
      fetchLeaves();
    } catch (err) {
      console.error('Failed to review leave request:', err);
    }
  };

  return { leaveRequests, loading, submitLeaveRequest, reviewLeaveRequest, refresh: fetchLeaves };
}
