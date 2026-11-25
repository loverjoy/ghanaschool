import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { Plus, Sparkles, Layers, BookOpen, AlertCircle } from 'lucide-react';

export default function ClassCurriculumPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, streams, subjects, addClassLevel, addStream, addSubject } = useClassLevels(schoolId);

  // Form States: Class Level
  const [levelName, setLevelName] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isTerminal, setIsTerminal] = useState(false);
  const [levelMsg, setLevelMsg] = useState('');

  // Form States: Stream
  const [streamName, setStreamName] = useState('');
  const [streamMsg, setStreamMsg] = useState('');

  // Form States: Subject
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjClassId, setSubjClassId] = useState('');
  const [subjMsg, setSubjMsg] = useState('');

  React.useEffect(() => {
    if (classLevels.length > 0) {
      setSubjClassId(classLevels[0].id);
    }
  }, [classLevels]);

  const handleCreateLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelName) return;
    await addClassLevel(levelName, Number(sortOrder), isTerminal);
    setLevelName('');
    setSortOrder(prev => prev + 1);
    setIsTerminal(false);
    setLevelMsg('Class Level registered.');
    setTimeout(() => setLevelMsg(''), 3000);
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamName) return;
    await addStream(streamName.toUpperCase());
    setStreamName('');
    setStreamMsg('Stream registered.');
    setTimeout(() => setStreamMsg(''), 3000);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName || !subjCode || !subjClassId) return;
    await addSubject(subjClassId, subjName, subjCode.toUpperCase());
    setSubjName('');
    setSubjCode('');
    setSubjMsg('Curriculum subject mapped.');
    setTimeout(() => setSubjMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Class & Curriculum Management</h1>
        <p className="text-sm text-slate-500">Configure academic blocks, streams, and syllabus courses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Class Levels */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Layers size={16} /> Grade Levels Setup
          </h3>

          <form onSubmit={handleCreateLevel} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Class Level Name</label>
              <input
                type="text"
                required
                placeholder="e.g. JHS 1 or SHS 2"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                value={levelName}
                onChange={(e) => setLevelName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Sort Order</label>
                <input
                  type="number"
                  required
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center mt-5">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTerminal}
                    onChange={(e) => setIsTerminal(e.target.checked)}
                  />
                  Terminal?
                </label>
              </div>
            </div>

            {levelMsg && <div className="text-[10px] text-emerald-500">{levelMsg}</div>}
            <button type="submit" className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded text-xs">
              Add Level
            </button>
          </form>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-400 mb-2">Registered Grade Levels</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {classLevels.map(c => (
                <div key={c.id} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded flex justify-between items-center text-xs">
                  <span>{c.name} (Sort: {c.sort_order})</span>
                  {c.is_terminal && (
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-bold">Terminal</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Streams */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Layers size={16} /> Streams Setup
          </h3>

          <form onSubmit={handleCreateStream} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Stream Name</label>
              <input
                type="text"
                required
                placeholder="e.g. A, B, Gold, Green"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
              />
            </div>

            {streamMsg && <div className="text-[10px] text-emerald-500">{streamMsg}</div>}
            <button type="submit" className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded text-xs" disabled={!school?.multi_stream_mode}>
              Add Stream
            </button>
            {!school?.multi_stream_mode && (
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-950 p-2 rounded">
                <AlertCircle size={12} />
                <span>Stream settings disabled. Enable Multi-Stream in Settings.</span>
              </div>
            )}
          </form>

          {school?.multi_stream_mode && (
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
              <h4 className="text-xs font-bold text-slate-400 mb-2">Registered streams</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {streams.map(s => (
                  <div key={s.id} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-xs">
                    Stream {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel 3: Subjects mapping */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <BookOpen size={16} /> Subjects Mapping
          </h3>

          <form onSubmit={handleCreateSubject} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Target Class Level</label>
              <select
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                value={subjClassId}
                onChange={(e) => setSubjClassId(e.target.value)}
              >
                {classLevels.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="MATH"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                />
              </div>
            </div>

            {subjMsg && <div className="text-[10px] text-emerald-500">{subjMsg}</div>}
            <button type="submit" className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded text-xs">
              Map Curriculum Subject
            </button>
          </form>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
            <h4 className="text-xs font-bold text-slate-400 mb-2">Subject curriculum Mappings</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {subjects.map(s => {
                const targetName = classLevels.find(c => c.id === s.class_level_id)?.name || 'JHS';
                return (
                  <div key={s.id} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded flex justify-between items-center text-xs">
                    <span>{s.name} (<code>{s.code}</code>)</span>
                    <span className="text-[10px] text-slate-500">{targetName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
