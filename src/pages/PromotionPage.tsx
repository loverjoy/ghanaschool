import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useStudents } from '../hooks/useStudents';
import { GraduationCap, Loader2, PlayCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PromotionPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels } = useClassLevels(schoolId);
  const { runBulkPromotion } = useStudents(schoolId);

  // Form States
  const [classLevelId, setClassLevelId] = useState('');
  const [term, setTerm] = useState('Term 3');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  React.useEffect(() => {
    if (classLevels.length > 0) {
      setClassLevelId(classLevels[0].id);
    }
  }, [classLevels]);

  const handleRunPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classLevelId || !term || !academicYear || !school) return;

    if (!window.confirm("WARNING: Bulk promotion updates students grade levels irreversibly based on Term average score parameters. Do you wish to continue?")) {
      return;
    }

    setRunning(true);
    setResult(null);

    const res = await runBulkPromotion(
      classLevelId as any,
      term,
      academicYear,
      school.passMark || 50
    );

    setResult(res);
    setRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Academic Promotion Wizard</h1>
        <p className="text-sm text-slate-500">Run bulk year-end promotions, apply thresholds, and process terminal graduates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Promotion Wizard config */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-500">
              <PlayCircle size={20} />
              Promotion Settings
            </h3>

            <form onSubmit={handleRunPromotion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Class Level to Promote
                </label>
                <select
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={classLevelId}
                  onChange={(e) => setClassLevelId(e.target.value)}
                >
                  {classLevels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Evaluation Term
                  </label>
                  <select
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3 (Recommended)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
              </div>

              {/* School specific rules */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs space-y-1.5 text-slate-500">
                <p><strong>Configured pass Mark:</strong> {school?.passMark}% term average</p>
                <p><strong>Terminal Level Handling:</strong> Students passing the terminal class level will change status to <strong>Graduated</strong> (added to Alumni portal).</p>
                <p><strong>Failing students:</strong> Students below {school?.passMark}% average are repeated in the same level.</p>
              </div>

              {result && (
                <div className={`text-xs p-3 rounded border flex items-start gap-2 ${
                  result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {result.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                  <span>{result.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={running}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition text-xs flex justify-center items-center gap-1.5"
              >
                {running ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Executing Promotions...
                  </>
                ) : (
                  <>
                    Run Bulk Promotion Engine
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Promotion logic diagram/rules */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-bold">Operational Guidelines</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ghana School Management System enforces RLS-isolated promotion rules following Ministry of Education guidelines:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1">
                <h4 className="font-bold text-amber-500">Idempotency</h4>
                <p className="text-slate-400 text-[10px]">
                  Running promotion multiple times is protected. Re-running will recalculate and refresh current student levels without multiplying records.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-1">
                <h4 className="font-bold text-emerald-500">Alumni Graduation</h4>
                <p className="text-slate-400 text-[10px]">
                  If the class sorting tier has `is_terminal = true`, passing students graduate immediately. You can print graduation certificates for them in the Alumni Directory.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
