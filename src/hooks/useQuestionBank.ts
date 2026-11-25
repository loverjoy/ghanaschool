import { useState, useEffect, useCallback } from 'react';
import { QuestionBankItem } from '../types';
import { apiFetch } from '../apiFetch';

export interface QuestionBankInput {
  subjectCode: string;
  classLevel: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  topic: string;
  questionType: 'MCQ' | 'Short Answer' | 'Essay' | 'True/False';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  createdBy?: string;
  createdByName?: string;
}

export function useQuestionBank(schoolId: string | null) {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!schoolId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/question-bank');
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch question bank:', err);
      setError(err.message || 'Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const createQuestion = async (payload: QuestionBankInput): Promise<QuestionBankItem> => {
    const result = await apiFetch('/api/question-bank', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    await fetchQuestions();
    return result.question;
  };

  const updateQuestion = async (id: string, payload: Partial<QuestionBankInput>): Promise<QuestionBankItem> => {
    const result = await apiFetch(`/api/question-bank/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    await fetchQuestions();
    return result.question;
  };

  const deleteQuestion = async (id: string): Promise<void> => {
    await apiFetch(`/api/question-bank/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    await fetchQuestions();
  };

  return {
    questions,
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refresh: fetchQuestions
  };
}
