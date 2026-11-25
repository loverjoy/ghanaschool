import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useStudents } from '../hooks/useStudents';
import { Student } from '../types';
import jsPDF from 'jspdf';
import { Search, Printer, Award, ShieldCheck } from 'lucide-react';

export default function AlumniPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { students } = useStudents(schoolId);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter graduated students only
  const alumniStudents = students.filter(
    s => s.status === 'Graduated' &&
         (`${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || (s.ghana_id || '').includes(searchTerm))
  );

  const handlePrintCertificate = (alumni: any) => {
    // Letter format in landscape: 11 x 8.5 inches
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: 'letter'
    });

    // 1. Draw outer gold border
    doc.setLineWidth(0.06);
    doc.setDrawColor(245, 158, 11); // Gold
    doc.rect(0.5, 0.5, 10.0, 7.5);

    // 2. Draw inner emerald green border
    doc.setLineWidth(0.02);
    doc.setDrawColor(16, 185, 129); // Emerald Green
    doc.rect(0.6, 0.6, 9.8, 7.3);

    // 3. Document Headers
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('REPUBLIC OF GHANA', 5.5, 1.8, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text('MINISTRY OF EDUCATION', 5.5, 2.2, { align: 'center' });

    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('This is to certify that', 5.5, 3.2, { align: 'center' });

    // 4. Student Name
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(217, 119, 6); // Amber 600
    doc.text(`${alumni.first_name.toUpperCase()} ${alumni.last_name.toUpperCase()}`, 5.5, 3.8, { align: 'center' });

    // 5. Completion text
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('has successfully completed the prescribed curriculum and passed all terminal examinations at', 5.5, 4.4, { align: 'center' });
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(school?.name || 'Secondary High School', 5.5, 4.8, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`National Ghana Card ID: ${alumni.ghana_id}`, 5.5, 5.3, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text('Graduation Year: Not recorded in student profile (Archive Record)', 5.5, 5.8, { align: 'center' });

    // 6. Signature Lines
    doc.line(1.5, 6.6, 3.5, 6.6);
    doc.text('Headmaster / Principal', 2.5, 6.8, { align: 'center' });

    doc.line(7.5, 6.6, 9.5, 6.6);
    doc.text('Ministry Registrar', 8.5, 6.8, { align: 'center' });

    // Save/Download PDF
    doc.save(`Graduation_Certificate_${alumni.first_name}_${alumni.last_name}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Alumni Tracking Directory</h1>
        <p className="text-sm text-slate-500">Search profiles of graduated students and download client-side PDF graduation certificates.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-6">
        
        {/* Search */}
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search alumni by name or Ghana ID..."
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
        </div>

        {/* Directory list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="pb-3">Graduate Name</th>
                <th className="pb-3">Ghana Card ID</th>
                <th className="pb-3">Gender</th>
                <th className="pb-3">Date of Birth</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-center">Credential Printout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {alumniStudents.map((alumni) => (
                <tr key={alumni.id} className="text-slate-800 dark:text-slate-300">
                  <td className="py-3.5 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award size={14} className="text-amber-500" />
                    {alumni.first_name} {alumni.last_name}
                  </td>
                  <td className="py-3.5">
                    <code>{alumni.ghana_id || 'N/A'}</code>
                  </td>
                  <td className="py-3.5">{alumni.gender}</td>
                  <td className="py-3.5">{alumni.dob}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Graduated
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <button
                      onClick={() => handlePrintCertificate(alumni)}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-600 dark:text-slate-300 rounded font-semibold transition flex items-center gap-1 mx-auto"
                    >
                      <Printer size={12} />
                      Print Certificate
                    </button>
                  </td>
                </tr>
              ))}
              {alumniStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No graduated alumni records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
