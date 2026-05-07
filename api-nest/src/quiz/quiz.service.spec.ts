import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { QuizService } from './quiz.service';

test('QuizService rejects ratings outside 1 to 5', async () => {
  const service = new QuizService({} as any, {
    requireUserFromRequest: () => ({ id: 'user-1' }),
  } as any);

  await assert.rejects(
    () => service.rateQuiz({}, 'quiz-1', 6),
    (error) => error instanceof BadRequestException,
  );
});
