import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { usePayments } from '../hooks/usePayments';
import { FeePayment } from '../types';
import jsPDF from 'jspdf';
import { Search, Plus, Printer, Wallet, FileText, CheckCircle2 } from 'lucide-react';

export default function PaymentsPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels } = useClassLevels(schoolId);
  const { students } = useStudents(schoolId);
  const { feeTypes, feePayments, addFeeType, recordPayment } = usePayments(schoolId);

  // Form States: Fee Type
  const [typeName, setTypeName] = useState('');
  const [typeAmount, setTypeAmount] = useState('');
  const [typeMsg, setTypeMsg] = useState('');

  // Form States: Record Payment
  const [payStudentId, setPayStudentId] = useState('');
  const [payTypeId, setPayTypeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payTerm, setPayTerm] = useState('Term 1');
  const [payYear, setPayYear] = useState('2025/2026');
  const [payMsg, setPayMsg] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  // Defaults
  useEffect(() => {
    if (students.length > 0) {
      setPayStudentId(students[0].id);
    }
    if (feeTypes.length > 0) {
      setPayTypeId(feeTypes[0].id);
      setPayAmount(feeTypes[0].amount.toString());
    }
  }, [students, feeTypes]);

  // Adjust default fee amount when type changes
  const handleTypeChange = (typeId: string) => {
    setPayTypeId(typeId);
    const type = feeTypes.find(f => f.id === typeId);
    if (type) {
      setPayAmount(type.amount.toString());
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName || !typeAmount) return;
    await addFeeType(typeName, Number(typeAmount));
    setTypeName('');
    setTypeAmount('');
    setTypeMsg('Fee Type registered.');
    setTimeout(() => setTypeMsg(''), 3000);
  };

  const handleRecordPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId || !payTypeId || !payAmount || !payDate || !payTerm || !payYear || !user) return;

    const res = await recordPayment({
      studentId: payStudentId,
      feeTypeId: payTypeId,
      amountPaid: Number(payAmount),
      paymentDate: payDate,
      term: payTerm,
      academicYear: payYear,
      collectorId: user.id
    });

    if (res) {
      setPayMsg(`Fees recorded. Receipt: ${res.receipt_number}`);
      setTimeout(() => setPayMsg(''), 4000);
    }
  };

  const handlePrintReceipt = (payment: FeePayment) => {
    const student = students.find(s => s.id === payment.student_id);
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Student';
    const className = classLevels.find(c => c.id === student?.class_level_id)?.name || 'JHS';
    const feeTypeName = feeTypes.find(f => f.id === payment.fee_type_id)?.name || 'Fees';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: 'letter'
    });

    // 1. Draw solid Header banner
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0.5, 0.5, 7.5, 1.2, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(school?.name || 'GSMS Federated Node', 4.0, 1.0, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(245, 158, 11); // Gold Accent
    doc.text('OFFICIAL TUITION PAYMENT RECEIPT', 4.0, 1.3, { align: 'center' });

    // 2. Receipt metadata
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(`Receipt Code: ${payment.receipt_number}`, 0.5, 2.2);
    doc.text(`Payment Date: ${payment.payment_date}`, 5.5, 2.2);
    doc.text(`Academic Period: ${payment.term} (${payment.academic_year})`, 0.5, 2.5);

    // 3. Student details block
    doc.setLineWidth(0.01);
    doc.setDrawColor(226, 232, 240); // Slate 200 border
    doc.rect(0.5, 2.8, 7.5, 1.3);

    doc.setFont('Helvetica', 'bold');
    doc.text('PUPIL INFORMATION DETAILS', 0.7, 3.1);
    
    doc.setFont('Helvetica', 'normal');
    doc.text(`Full Name: ${studentName}`, 0.7, 3.4);
    doc.text(`Class Level: ${className}`, 0.7, 3.75);
    doc.text(`National ID: ${student?.ghana_id || 'N/A'}`, 5.0, 3.4);

    // 4. Billing summary table
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.rect(0.5, 4.5, 7.5, 0.4, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.text('TUITION / ACCOUNT DESCRIPTION', 0.7, 4.75);
    doc.text('AMOUNT PAID', 7.8, 4.75, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.text(feeTypeName, 0.7, 5.3);
    doc.text(`GHS ${payment.amount_paid}.00`, 7.8, 5.3, { align: 'right' });

    // Underline
    doc.line(0.5, 5.6, 8.0, 5.6);

    // Total
    doc.setFont('Helvetica', 'bold');
    doc.text('TOTAL CREDITED:', 4.8, 6.0);
    doc.text(`GHS ${payment.amount_paid}.00`, 7.8, 6.0, { align: 'right' });

    // 5. Signoff
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Collector Signature:', 0.5, 7.0);
    doc.line(2.0, 7.0, 4.0, 7.0);
    
    doc.setFont('Helvetica', 'italic');
    doc.text('Thank you for your cooperation.', 4.0, 7.6, { align: 'center' });

    // Save PDF
    doc.save(`Receipt_${payment.receipt_number}.pdf`);
  };

  // Search filter payments list
  const filteredPayments = feePayments.filter(pay => {
    const student = students.find(s => s.id === pay.student_id);
    const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
    const matchSearch = studentName.includes(searchTerm.toLowerCase()) || pay.receipt_number.includes(searchTerm);
    const matchType = filterType ? pay.fee_type_id === filterType : true;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Tuition & Fee Records</h1>
        <p className="text-sm text-slate-500">Record tuition balances, search receipt invoices, and generate branded PDF payment slips.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: forms */}
        <div className="lg:col-span-4 space-y-6">
          {/* Create Fee Type */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
              <Plus size={16} /> Configure Fee Type
            </h3>

            <form onSubmit={handleCreateType} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fee Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee Term 1"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Standard Amount (GHS)</label>
                <input
                  type="number"
                  required
                  placeholder="1200"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={typeAmount}
                  onChange={(e) => setTypeAmount(e.target.value)}
                />
              </div>

              {typeMsg && <div className="text-[10px] text-emerald-500">{typeMsg}</div>}
              <button type="submit" className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded text-xs">
                Register Fee Type
              </button>
            </form>
          </div>

          {/* Record payment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
              <Plus size={16} /> Record Student Payment
            </h3>

            <form onSubmit={handleRecordPay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Select Student</label>
                <select
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(e.target.value)}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fee Type</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={payTypeId}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    {feeTypes.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Amount Paid (GHS)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Term</label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={payTerm}
                    onChange={(e) => setPayTerm(e.target.value)}
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={payYear}
                    onChange={(e) => setPayYear(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              {payMsg && (
                <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded p-2.5 text-center">
                  {payMsg}
                </div>
              )}

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs">
                Commit & Log Slip
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Search & lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6">
            
            {/* Search/Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by student name or receipt number..."
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
              </div>

              <select
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">All Fee Types</option>
                {feeTypes.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Fee Category</th>
                    <th className="pb-3">Receipt Code</th>
                    <th className="pb-3">Amount Credited</th>
                    <th className="pb-3">Payment Date</th>
                    <th className="pb-3 text-center">Receipt Printout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredPayments.map((pay) => {
                    const student = students.find(s => s.id === pay.student_id);
                    const studentName = student ? `${student.first_name} ${student.last_name}` : 'Student';
                    const feeTypeName = feeTypes.find(f => f.id === pay.fee_type_id)?.name || 'Fees';
                    
                    return (
                      <tr key={pay.id} className="text-slate-800 dark:text-slate-300">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {studentName}
                        </td>
                        <td className="py-3">{feeTypeName}</td>
                        <td className="py-3">
                          <code>{pay.receipt_number}</code>
                        </td>
                        <td className="py-3 font-bold text-slate-950 dark:text-slate-100">
                          GHS {pay.amount_paid}.00
                        </td>
                        <td className="py-3">{pay.payment_date}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handlePrintReceipt(pay)}
                            className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-600 dark:text-slate-300 rounded font-semibold transition flex items-center gap-1 mx-auto"
                          >
                            <Printer size={12} />
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">
                        No payments logs found matching filter criteria.
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
