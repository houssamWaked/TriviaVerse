import React from 'react';
import { ICONS } from '@/constants/icons';

type ReviewQuestion = {
  session_question_id?: string | null;
  question_number?: number | null;
  question_text?: string | null;
  is_correct?: boolean | null;
  chosen_label?: string | null;
  chosen_text?: string | null;
  correct_label?: string | null;
  correct_text?: string | null;
  explanation?: string | null;
};

type ReviewData = {
  questions?: ReviewQuestion[];
};

type StoryResult = {
  passed: boolean;
  stars: number;
};

type ClassicResult = {
  levelNum?: number | null;
  passed?: boolean;
  stars?: number;
  hasNextLevel?: boolean;
};

type Props = {
  busy: boolean;
  isStory: boolean;
  storyLevelNumber: number | null;
  storyResult: StoryResult | null;
  classicResult: ClassicResult | null;
  scoreDisplay: string;
  accuracyPct: number;
  correctCount: number;
  answeredCount: number;
  reviewBusy: boolean;
  reviewError: string;
  review: ReviewData | null;
  onNavigateHome: () => void;
  playNextLevel: () => void;
  playNextClassicLevel: () => void;
  playAgain: () => void;
  doShare: () => void;
  shareMessage: string;
  shareText: string;
  modeLabel: string;
};

/**
 * End-of-session results screen: score summary, share CTA, and review of missed questions.
 * @param review Session review data for explanations.
 * @param playAgain Callback to restart flow.
 * @returns React element.
 */
export default function PlaySessionResults({
  busy,
  isStory,
  storyLevelNumber,
  storyResult,
  classicResult,
  scoreDisplay,
  accuracyPct,
  correctCount,
  answeredCount,
  reviewBusy,
  reviewError,
  review,
  onNavigateHome,
  playNextLevel,
  playNextClassicLevel,
  playAgain,
  doShare,
  shareMessage,
  shareText,
  modeLabel,
}: Props) {
  const items = Array.isArray(review?.questions) ? review.questions : [];
  const wrong = items.filter((q) => q && q.is_correct === false);

  return (
    <div className="tv-results">
      <div className="tv-results__hero">
        <div className="tv-results__heroIcons" aria-hidden="true">
          <span className="tv-results__heroIcon">{ICONS.common.rocket}</span>
          <span className="tv-results__heroIcon">{ICONS.common.book}</span>
        </div>
        <h1 className="tv-results__title">KEEP GOING!</h1>
        <div className="tv-results__subtitle">Every try makes you better!</div>

        <div className="tv-card tv-results__shareCard">
          <div className="tv-results__shareTitle">
            {ICONS.common.phone} Share your score with friends!
          </div>
          <div className="tv-results__sharePreview">
            {ICONS.common.gamepad} I just scored <span className="tv-results__shareScore">{scoreDisplay}</span>{' '}
            in <span className="tv-results__shareMode">{modeLabel}</span>
            {isStory && Number.isFinite(Number(storyLevelNumber))
              ? ` (Level ${Number(storyLevelNumber)})`
              : ''}
            !
            <div className="tv-results__shareHint">
              Can you beat me on TriviaVerse? {ICONS.common.rocket}
            </div>
          </div>
        </div>

        <div className="tv-results__keepPlaying">
          {ICONS.common.rocket} Keep playing to improve! {ICONS.common.rocket}
        </div>
      </div>

      <div className="tv-card tv-results__card">
        <div className="tv-results__modeLine">{modeLabel}</div>
        {isStory && Number.isFinite(Number(storyLevelNumber)) ? (
          <div className="tv-results__levelLine">
            Level {Number(storyLevelNumber)} {ICONS.common.star}
          </div>
        ) : null}
        {isStory && storyResult ? (
          <div className="tv-results__levelLine">
            {storyResult.passed ? '✅ Passed' : '❌ Not passed'} • {'★'.repeat(storyResult.stars)}
            {'☆'.repeat(Math.max(0, 3 - storyResult.stars))}
          </div>
        ) : null}
        {classicResult?.levelNum ? (
          <div className="tv-results__levelLine">
            Level {Number(classicResult.levelNum)} {ICONS.common.star}
          </div>
        ) : null}
        {classicResult ? (
          <div className="tv-results__levelLine">
            {classicResult.passed ? '✅ Passed' : '❌ Not passed'} • {'★'.repeat(classicResult.stars)}
            {'☆'.repeat(Math.max(0, 3 - classicResult.stars))}
          </div>
        ) : null}

        <div className="tv-results__scorePanel">
          <div className="tv-results__scoreLabel">YOUR SCORE</div>
          <div className="tv-results__scoreValue">{scoreDisplay}</div>
          <div className="tv-results__scoreMeta">{ICONS.common.target} {accuracyPct}% Accuracy!</div>
        </div>

        <div className="tv-results__statsGrid">
          <div className="tv-results__stat tv-results__stat--blue">
            <div className="tv-results__statIcon">{ICONS.common.target}</div>
            <div className="tv-results__statValue">{correctCount}/{answeredCount}</div>
            <div className="tv-results__statLabel">Correct! {ICONS.common.tick}</div>
          </div>
          <div className="tv-results__stat tv-results__stat--purple">
            <div className="tv-results__statIcon">{ICONS.common.trophy}</div>
            <div className="tv-results__statValue">{accuracyPct}%</div>
            <div className="tv-results__statLabel">Accuracy! {ICONS.common.target}</div>
          </div>
        </div>
      </div>

      <div className="tv-card tv-results__reviewCard">
        <div className="tv-results__reviewTitle">{ICONS.common.book} Answer review</div>
        {reviewBusy ? (
          <div className="tv-results__reviewEmpty">Loading…</div>
        ) : reviewError ? (
          <div className="tv-results__reviewEmpty">{reviewError}</div>
        ) : wrong.length === 0 ? (
          <div className="tv-results__reviewEmpty">No wrong answers — nice!</div>
        ) : (
          <div className="tv-results__reviewList">
            {wrong.map((q) => (
              <div key={q.session_question_id || q.question_number} className="tv-results__reviewItem">
                <div className="tv-results__reviewQ">Q{q.question_number}: {q.question_text}</div>
                <div className="tv-results__reviewMeta">
                  Your answer: {q.chosen_label ? `${q.chosen_label}. ` : ''}{q.chosen_text || '—'} • Correct: {q.correct_label ? `${q.correct_label}. ` : ''}{q.correct_text || '—'}
                </div>
                {!!q.explanation && <div className="tv-results__reviewExplanation">{q.explanation}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="tv-results__actions">
        <button type="button" className="tv-card tv-card--hover tv-results__btn" onClick={onNavigateHome} disabled={busy}>🏠 Home</button>
        {isStory && storyResult?.passed ? (
          <button type="button" className="tv-card tv-card--hover tv-results__btn" onClick={playNextLevel} disabled={busy}>➡️ Next level</button>
        ) : null}
        {classicResult?.passed && classicResult?.hasNextLevel ? (
          <button type="button" className="tv-card tv-card--hover tv-results__btn" onClick={playNextClassicLevel} disabled={busy}>➡️ Next level</button>
        ) : null}
        <button type="button" className="tv-card tv-card--hover tv-results__btn" onClick={playAgain} disabled={busy}>{ICONS.common.refresh} Again!</button>
        <button type="button" className="tv-card tv-card--hover tv-results__btn tv-results__btn--share" onClick={doShare} disabled={busy}>{ICONS.common.rocket} Share!</button>
      </div>

      {!!shareMessage && <div className="tv-results__shareMessage">{shareMessage}</div>}
      <span className="tv-results__shareText" aria-hidden="true">{shareText}</span>
    </div>
  );
}

