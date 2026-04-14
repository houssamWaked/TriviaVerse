/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { STRINGS } from '@/constants/strings';

/**
 * Validate quiz questions before publishing (minimum options, exactly one correct, has explanation).
 * @param questions Quiz questions with options.
 * @returns List of validation issue strings (empty means publishable).
 */
function validateQuestionsForPublish(questions: any[] = []) {
  const issues: string[] = [];
  for (const q of questions || []) {
    const opts = Array.isArray(q?.options) ? q.options : [];
    const optionCount = opts.length;
    const correctCount = opts.filter((o) => !!o.is_correct).length;
    const hasExplanation = !!String(q?.explanation || '').trim();

    if (optionCount < 2) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsOptions(q?.order_index ?? '?')
      );
    }
    if (correctCount !== 1) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsCorrect(
          q?.order_index ?? '?',
          correctCount
        )
      );
    }
    if (!hasExplanation) {
      issues.push(
        STRINGS.CREATE_QUIZ.validation.questionNeedsExplanation(q?.order_index ?? '?')
      );
    }
  }
  return issues;
}

export function useCreateQuizPublishValidation(quiz: any, questions: any[]) {
  return useMemo(() => {
    const publishIssues = validateQuestionsForPublish(questions);
    const canPublish = quiz?.status !== 'published' && publishIssues.length === 0;
    return { publishIssues, canPublish };
  }, [questions, quiz?.status]);
}

