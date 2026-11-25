import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { useClassLevels } from '../hooks/useClassLevels';
import { useQuestionBank, QuestionBankInput } from '../hooks/useQuestionBank';
import { QuestionBankItem, QuestionDifficulty, QuestionType } from '../types';
import {
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  FileDown,
  CheckSquare,
  Square,
  HelpCircle,
  BookOpen,
  Award,
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

const QUESTION_TYPES: QuestionType[] = ['MCQ', 'Short Answer', 'Essay', 'True/False'];
const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];
const TERMS: Array<'Term 1' | 'Term 2' | 'Term 3'> = ['Term 1', 'Term 2', 'Term 3'];

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface FormState {
  subjectCode: string;
  classLevel: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  topic: string;
  questionType: QuestionType;
  difficulty: QuestionDifficulty;
  marks: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const getEmptyForm = (defaultSubject = 'MTH', defaultClass = 'JHS 1'): FormState => ({
  subjectCode: defaultSubject,
  classLevel: defaultClass,
  term: 'Term 1',
  topic: '',
  questionType: 'MCQ',
  difficulty: 'Medium',
  marks: '2',
  questionText: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  explanation: ''
});

export default function QuestionBankPage() {
  const { user } = useAuth();
  const schoolId = user?.school_id || null;

  const { school } = useSchool(schoolId);
  const { classLevels, subjects } = useClassLevels(schoolId);
  const {
    questions,
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion
  } = useQuestionBank(schoolId);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('ALL');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterTerm, setFilterTerm] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');

  // UI states
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QuestionBankItem | null>(null);
  const [form, setForm] = useState<FormState>(getEmptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Deduplicated subject map for dropdowns & display
  const subjectOptions = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach(s => {
      if (s.code && !map.has(s.code)) {
        map.set(s.code, s.name);
      }
    });
    questions.forEach(q => {
      if (q.subjectCode && !map.has(q.subjectCode)) {
        map.set(q.subjectCode, q.subjectCode);
      }
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [subjects, questions]);

  const getSubjectLabel = (code: string) => {
    const found = subjectOptions.find(s => s.code === code);
    return found ? `${found.name} (${found.code})` : code;
  };

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return questions.filter(item => {
      if (filterSubject !== 'ALL' && item.subjectCode !== filterSubject) return false;
      if (filterClass !== 'ALL' && item.classLevel !== filterClass) return false;
      if (filterTerm !== 'ALL' && item.term !== filterTerm) return false;
      if (filterType !== 'ALL' && item.questionType !== filterType) return false;
      if (filterDifficulty !== 'ALL' && item.difficulty !== filterDifficulty) return false;
      if (q) {
        const hay = [
          item.questionText,
          item.topic,
          item.subjectCode,
          getSubjectLabel(item.subjectCode),
          item.correctAnswer,
          item.createdByName
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [questions, searchQuery, filterSubject, filterClass, filterTerm, filterType, filterDifficulty, subjectOptions]);

  // Metrics
  const totalMarksPool = useMemo(
    () => filteredQuestions.reduce((acc, item) => acc + Number(item.marks || 0), 0),
    [filteredQuestions]
  );

  const uniqueSubjectsCount = useMemo(
    () => new Set(questions.map(q => q.subjectCode)).size,
    [questions]
  );

  const selectedQuestions = useMemo(
    () => questions.filter(q => selectedIds.includes(q.id)),
    [questions, selectedIds]
  );

  const selectedMarksTotal = useMemo(
    () => selectedQuestions.reduce((acc, q) => acc + Number(q.marks || 0), 0),
    [selectedQuestions]
  );

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterSubject('ALL');
    setFilterClass('ALL');
    setFilterTerm('ALL');
    setFilterType('ALL');
    setFilterDifficulty('ALL');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterSubject !== 'ALL' ||
    filterClass !== 'ALL' ||
    filterTerm !== 'ALL' ||
    filterType !== 'ALL' ||
    filterDifficulty !== 'ALL';

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredQuestions.map(q => q.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    const defaultSub = subjectOptions[0]?.code || 'MTH';
    const defaultCls = classLevels[0]?.id || 'JHS 1';
    setEditingItem(null);
    setForm(getEmptyForm(defaultSub, defaultCls));
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item: QuestionBankItem) => {
    const paddedOptions =
      item.questionType === 'MCQ'
        ? [0, 1, 2, 3].map(i => (item.options && item.options[i]) || '')
        : ['', '', '', ''];

    setEditingItem(item);
    setForm({
      subjectCode: item.subjectCode,
      classLevel: item.classLevel,
      term: item.term,
      topic: item.topic || '',
      questionType: item.questionType,
      difficulty: item.difficulty,
      marks: String(item.marks),
      questionText: item.questionText,
      options: paddedOptions,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation || ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleTypeChange = (nextType: QuestionType) => {
    setForm(prev => {
      if (nextType === 'True/False') {
        return {
          ...prev,
          questionType: nextType,
          options: ['True', 'False'],
          correctAnswer: prev.correctAnswer === 'False' ? 'False' : 'True'
        };
      }
      if (nextType === 'MCQ') {
        const opts = prev.options.length >= 4 ? prev.options : ['', '', '', ''];
        return {
          ...prev,
          questionType: nextType,
          options: opts,
          correctAnswer: opts.includes(prev.correctAnswer) ? prev.correctAnswer : ''
        };
      }
      return {
        ...prev,
        questionType: nextType,
        options: ['', '', '', '']
      };
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    setForm(prev => {
      const updated = [...prev.options];
      const oldVal = updated[index];
      updated[index] = value;
      const updatedCorrect = oldVal !== '' && prev.correctAnswer === oldVal ? value : prev.correctAnswer;
      return { ...prev, options: updated, correctAnswer: updatedCorrect };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const marksNum = Number(form.marks);
    if (!form.questionText.trim()) {
      setFormError('Question text is required.');
      return;
    }
    if (!form.subjectCode.trim()) {
      setFormError('Please select or enter a subject.');
      return;
    }
    if (!Number.isFinite(marksNum) || marksNum < 1 || marksNum > 100) {
      setFormError('Marks must be a number between 1 and 100.');
      return;
    }

    let finalOptions: string[] = [];
    if (form.questionType === 'MCQ') {
      finalOptions = form.options.map(o => o.trim()).filter(Boolean);
      if (finalOptions.length < 2) {
        setFormError('Multiple choice questions require at least 2 options.');
        return;
      }
      if (!form.correctAnswer.trim() || !finalOptions.includes(form.correctAnswer.trim())) {
        setFormError('Please select one of the filled options as the correct answer.');
        return;
      }
    } else if (form.questionType === 'True/False') {
      finalOptions = ['True', 'False'];
      if (form.correctAnswer !== 'True' && form.correctAnswer !== 'False') {
        setFormError('Please select True or False as the correct answer.');
        return;
      }
    } else if (!form.correctAnswer.trim()) {
      setFormError('Correct answer / marking scheme is required.');
      return;
    }

    const payload: QuestionBankInput = {
      subjectCode: form.subjectCode.trim(),
      classLevel: form.classLevel,
      term: form.term,
      topic: form.topic.trim(),
      questionType: form.questionType,
      difficulty: form.difficulty,
      marks: marksNum,
      questionText: form.questionText.trim(),
      options: finalOptions,
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation.trim(),
      createdBy: user?.id || 'unknown',
      createdByName: user?.name || 'Staff Member'
    };

    setSaving(true);
    try {
      if (editingItem) {
        await updateQuestion(editingItem.id, payload);
        showToast('success', 'Question updated successfully.');
      } else {
        await createQuestion(payload);
        showToast('success', 'Question added to the bank.');
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: QuestionBankItem) => {
    const confirmed = window.confirm(`Delete this ${item.subjectCode} (${item.classLevel}) question? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteQuestion(item.id);
      setSelectedIds(prev => prev.filter(id => id !== item.id));
      showToast('success', 'Question deleted.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete question.');
    }
  };

  // PDF Export (Exam Paper or Marking Scheme)
  const exportPdf = (includeAnswers: boolean) => {
    const targetList = selectedQuestions.length > 0 ? selectedQuestions : filteredQuestions;
    if (targetList.length === 0) {
      showToast('error', 'No questions available to export.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxLineWidth = pageWidth - margin * 2;
    let y = 50;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 50) {
        doc.addPage();
        y = 50;
      }
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text((school?.name || 'GHANA SCHOOL MANAGEMENT SYSTEM').toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 18;

    doc.setFontSize(11);
    doc.text(includeAnswers ? 'EXAMINATION MARKING SCHEME' : 'EXAMINATION QUESTION PAPER', pageWidth / 2, y, { align: 'center' });
    y += 16;

    const totalMarks = targetList.reduce((acc, q) => acc + Number(q.marks || 0), 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Questions: ${targetList.length}   |   Total Marks: ${totalMarks}   |   Date: ${new Date().toISOString().split('T')[0]}`, pageWidth / 2, y, { align: 'center' });
    y += 14;

    if (!includeAnswers) {
      doc.setDrawColor(180);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;
      doc.text('Student Name: _______________________________________   Class: ______________   Index No.: ______________', margin, y);
      y += 14;
    }

    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 22;

    targetList.forEach((q, idx) => {
      ensureSpace(70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      const headerLine = `${idx + 1}. [${q.subjectCode} | ${q.classLevel} | ${q.marks} ${q.marks === 1 ? 'mark' : 'marks'}]`;
      doc.text(headerLine, margin, y);
      y += 15;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const wrappedQ = doc.splitTextToSize(q.questionText, maxLineWidth);
      wrappedQ.forEach((line: string) => {
        ensureSpace(16);
        doc.text(line, margin, y);
        y += 14;
      });

      if (q.questionType === 'MCQ' && q.options && q.options.length > 0) {
        y += 2;
        q.options.forEach((opt, optIdx) => {
          ensureSpace(16);
          const optText = `   ${OPTION_LABELS[optIdx] || String(optIdx + 1)}. ${opt}`;
          const wrappedOpt = doc.splitTextToSize(optText, maxLineWidth - 10);
          wrappedOpt.forEach((line: string) => {
            doc.text(line, margin + 8, y);
            y += 13;
          });
        });
      } else if (q.questionType === 'True/False') {
        ensureSpace(16);
        doc.text('   [  ] True      [  ] False', margin + 8, y);
        y += 14;
      }

      if (includeAnswers) {
        y += 4;
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(22, 101, 52);
        const ansLines = doc.splitTextToSize(`Answer: ${q.correctAnswer}`, maxLineWidth);
        ansLines.forEach((line: string) => {
          ensureSpace(14);
          doc.text(line, margin + 6, y);
          y += 13;
        });

        if (q.explanation) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(80, 80, 80);
          const expLines = doc.splitTextToSize(`Marking Guide: ${q.explanation}`, maxLineWidth);
          expLines.forEach((line: string) => {
            ensureSpace(14);
            doc.text(line, margin + 6, y);
            y += 13;
          });
        }
        doc.setTextColor(0, 0, 0);
      }

      y += 14;
    });

    const filename = includeAnswers
      ? `GSMS_Marking_Scheme_${new Date().toISOString().split('T')[0]}.pdf`
      : `GSMS_Exam_Paper_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    showToast('success', `Exported ${targetList.length} question(s) to ${filename}.`);
  };

  const getDifficultyStyle = (diff: QuestionDifficulty) => {
    if (diff === 'Easy') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (diff === 'Hard') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  const allFilteredSelected =
    filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.includes(q.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2.5">
            <HelpCircle className="text-amber-500" size={26} />
            Question Bank
          </h1>
          <p className="text-sm text-slate-500">
            Curate curriculum-aligned exam questions, marking schemes, and printable assessment papers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportPdf(false)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700"
            title="Export selected questions (or all filtered questions) as an Exam Paper PDF"
          >
            <FileDown size={15} />
            Exam Paper PDF
          </button>
          <button
            onClick={() => exportPdf(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition border border-emerald-500/20"
            title="Export Marking Scheme PDF with answers"
          >
            <FileDown size={15} />
            Marking Scheme PDF
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-sm"
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Questions</span>
            <HelpCircle size={16} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-slate-900 dark:text-white">
            {filteredQuestions.length}
            {filteredQuestions.length !== questions.length && (
              <span className="text-xs font-normal text-slate-500 ml-1.5">/ {questions.length}</span>
            )}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Subjects Covered</span>
            <BookOpen size={16} className="text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-slate-900 dark:text-white">
            {uniqueSubjectsCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Marks Pool (Shown)</span>
            <Award size={16} className="text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-slate-900 dark:text-white">
            {totalMarksPool} <span className="text-xs font-normal text-slate-500">mks</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Selected for Paper</span>
            <CheckSquare size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-2xl font-bold font-display text-slate-900 dark:text-white">
              {selectedQuestions.length}
              <span className="text-xs font-normal text-slate-500 ml-1.5">({selectedMarksTotal} mks)</span>
            </p>
            {selectedQuestions.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] font-semibold text-amber-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text, topic, subject, or marking scheme..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAllAnswers(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition"
            >
              {showAllAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAllAnswers ? 'Hide Answers' : 'Reveal All Answers'}
            </button>

            <button
              onClick={selectAllFiltered}
              disabled={filteredQuestions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 transition disabled:opacity-40"
            >
              {allFilteredSelected ? <CheckSquare size={14} className="text-amber-500" /> : <Square size={14} />}
              {allFilteredSelected ? 'Unselect Shown' : 'Select Shown'}
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-amber-500 hover:bg-amber-500/10 transition"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400 shrink-0" />
            <select
              aria-label="Filter by Subject"
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="ALL">All Subjects</option>
              {subjectOptions.map(s => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Filter by Class Level"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="ALL">All Class Levels</option>
            {classLevels.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Term"
            value={filterTerm}
            onChange={e => setFilterTerm(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="ALL">All Terms</option>
            {TERMS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Question Type"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="ALL">All Types</option>
            {QUESTION_TYPES.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Difficulty"
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          >
            <option value="ALL">All Difficulties</option>
            {DIFFICULTIES.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-sm text-slate-500 animate-pulse">
          Loading school question bank...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <HelpCircle size={36} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No matching questions found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveFilters
              ? 'Try clearing or broadening your filters, or add a new question for this topic.'
              : 'Your school question bank is empty. Click "Add Question" to create your first curriculum question.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
            >
              Add Question
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);
            const isRevealed = showAllAnswers || !!revealedIds[item.id];
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 space-y-4 transition ${
                  isSelected
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Card Top Meta Row */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="text-slate-400 hover:text-amber-500 transition"
                      title={isSelected ? 'Remove from exam paper selection' : 'Select for exam paper export'}
                    >
                      {isSelected ? (
                        <CheckSquare size={18} className="text-amber-500" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>

                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                      {getSubjectLabel(item.subjectCode)}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.classLevel}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.term}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {item.questionType}
                    </span>

                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getDifficultyStyle(item.difficulty)}`}>
                      {item.difficulty}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950">
                      {item.marks} {item.marks === 1 ? 'mk' : 'mks'}
                    </span>

                    {item.topic && (
                      <span className="text-[11px] text-slate-500 italic">Topic: {item.topic}</span>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleReveal(item.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                      {isRevealed ? 'Hide Key' : 'Answer Key'}
                    </button>
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 transition"
                      title="Edit question"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition"
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {item.questionText}
                </p>

                {/* MCQ Options */}
                {item.questionType === 'MCQ' && item.options && item.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = isRevealed && opt === item.correctAnswer;
                      return (
                        <div
                          key={optIdx}
                          className={`px-3 py-2 rounded-lg text-xs border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-bold text-amber-500">{OPTION_LABELS[optIdx] || optIdx + 1}.</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer Key & Marking Scheme */}
                {isRevealed && (
                  <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Answer / Marking Scheme
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {item.correctAnswer}
                    </p>
                    {item.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-emerald-500/15">
                        <strong className="font-semibold">Marking Guide:</strong> {item.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>Added by {item.createdByName || 'Staff'}</span>
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold font-display text-slate-900 dark:text-white">
                {editingItem ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-500">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={form.subjectCode}
                    onChange={e => setForm(prev => ({ ...prev, subjectCode: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    {subjectOptions.length === 0 ? (
                      <option value="MTH">Mathematics (MTH)</option>
                    ) : (
                      subjectOptions.map(s => (
                        <option key={s.code} value={s.code}>
                          {s.name} ({s.code})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Class Level *
                  </label>
                  <select
                    required
                    value={form.classLevel}
                    onChange={e => setForm(prev => ({ ...prev, classLevel: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    {classLevels.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Term *
                  </label>
                  <select
                    required
                    value={form.term}
                    onChange={e => setForm(prev => ({ ...prev, term: e.target.value as FormState['term'] }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    {TERMS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Question Type *
                  </label>
                  <select
                    value={form.questionType}
                    onChange={e => handleTypeChange(e.target.value as QuestionType)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    {QUESTION_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Difficulty *
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value as QuestionDifficulty }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Marks (1-100) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={form.marks}
                    onChange={e => setForm(prev => ({ ...prev, marks: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Topic / Syllabus Strand
                </label>
                <input
                  type="text"
                  placeholder="e.g. Algebraic Expressions, Photosynthesis, Comprehension"
                  value={form.topic}
                  onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter the full exam question..."
                  value={form.questionText}
                  onChange={e => setForm(prev => ({ ...prev, questionText: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              {/* Dynamic Options / Answer Key */}
              {form.questionType === 'MCQ' && (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Multiple Choice Options (Select the radio button for the correct answer)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {OPTION_LABELS.map((label, i) => (
                      <div key={label} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mcqCorrect"
                          checked={form.options[i] !== '' && form.correctAnswer === form.options[i]}
                          onChange={() => setForm(prev => ({ ...prev, correctAnswer: prev.options[i] }))}
                          disabled={!form.options[i]?.trim()}
                          title={`Mark option ${label} as correct`}
                        />
                        <span className="text-xs font-bold text-amber-500 w-4">{label}.</span>
                        <input
                          type="text"
                          placeholder={`Option ${label}`}
                          value={form.options[i] || ''}
                          onChange={e => handleOptionChange(i, e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.questionType === 'True/False' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Correct Answer *
                  </label>
                  <select
                    value={form.correctAnswer || 'True'}
                    onChange={e => setForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {(form.questionType === 'Short Answer' || form.questionType === 'Essay') && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Model Answer / Marking Scheme *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide the expected model answer or key marking points..."
                    value={form.correctAnswer}
                    onChange={e => setForm(prev => ({ ...prev, correctAnswer: e.target.value }))}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Marking Guide / Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional mark allocation breakdown or teacher notes..."
                  value={form.explanation}
                  onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Add to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
