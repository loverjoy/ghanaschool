import { useState, useEffect } from 'react';
import { apiFetch } from '../apiFetch';

export function usePayments(schoolId: string | null) {
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/api/data');
      if (data) {
        const schoolTypes = (data.feeTypes || []).filter((f: any) => f.schoolName === schoolId);
        const schoolPayments = (data.feePayments || []).filter((f: any) => f.schoolName === schoolId);

        setFeeTypes(schoolTypes.map((f: any) => ({
          id: f.id,
          school_id: schoolId,
          name: f.name,
          amount: Number(f.amount || 0)
        })));

        setFeePayments(schoolPayments.map((p: any) => ({
          id: p.id,
          school_id: schoolId,
          student_id: p.studentId,
          fee_type_id: p.feeTypeId,
          amount_paid: Number(p.amountPaid || 0),
          payment_date: p.paymentDate,
          receipt_number: p.receiptNumber,
          term: p.term,
          academic_year: String(p.year || '2025/2026'),
          collector_id: p.collectorId
        })));
      }
    } catch (err) {
      console.error('Failed to fetch payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const addFeeType = async (name: string, amount: number) => {
    if (!schoolId) return;
    try {
      await apiFetch('/api/fee-types', {
        method: 'POST',
        body: JSON.stringify({
          name,
          amount
        })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to add fee type:', err);
    }
  };

  const recordPayment = async (paymentData: {
    studentId: string;
    feeTypeId: string;
    amountPaid: number;
    paymentDate: string;
    term: string;
    academicYear: string;
    collectorId: string;
  }) => {
    if (!schoolId) return null;

    try {
      const receiptNumber = `REC-${Math.floor(100000 + Math.random() * 900000)}`;
      const result = await apiFetch('/api/fee-payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: paymentData.studentId,
          feeTypeId: paymentData.feeTypeId,
          amountPaid: paymentData.amountPaid,
          paymentDate: paymentData.paymentDate,
          receiptNumber,
          term: paymentData.term,
          year: isNaN(parseInt(paymentData.academicYear)) ? 2026 : parseInt(paymentData.academicYear),
          collectorId: paymentData.collectorId
        })
      });

      fetchData();
      return result.feePayment;
    } catch (err) {
      console.error('Failed to record payment:', err);
      return null;
    }
  };

  return { feeTypes, feePayments, loading, addFeeType, recordPayment, refresh: fetchData };
}
