import { useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import QuizViewStyle from '@/Styles/ComponentStyles/QuizViewStyle';
import { getApiErrorMessage, isUnauthorized } from '@/utils/apiError';
import QuizViewStatusCards from '@/features/QuizView/components/QuizViewStatusCards';
import { useQuizViewData } from '@/features/QuizView/hooks/useQuizViewData';
import type { Friend, QuizViewPageProps, RatingsResponse } from '@/features/QuizView/types';

export type { QuizViewPageProps } from '@/features/QuizView/types';

const strings = STRINGS;
const icons = ICONS;
const styles = QuizViewStyle;

export default function QuizViewPage({
  quizId,
  user,
  onRequireAuth,
  onBack,
  onEditQuiz,
  onPlaySession,
  onOpenDuel,
}: QuizViewPageProps) {
  const {
    busy,
    setBusy,
    error,
    setError,
    success,
    setSuccess,
    needsLogin,
    data,
    ratings,
    setRatings,
    leaderboard,
    load,
    ratingText,
  } = useQuizViewData({ quizId, user });

  const [duelOpen, setDuelOpen] = useState(false);
  const [duelFriends, setDuelFriends] = useState<Friend[]>([]);
  const [duelFriendId, setDuelFriendId] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportMessage, setReportMessage] = useState('');

  const quiz = data?.quiz;
  const canEdit = !!data?.can_edit;
  const duelAllowed = quiz?.status === 'published';
  const questionsCount = Number(data?.questions_count);

  const onRate = async (value: number) => {
    if (!user) return onRequireAuth?.('quiz');

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const nextRatings = (await api.rateQuiz(quizId, { rating: value })) as RatingsResponse;
      setRatings(nextRatings);
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('quiz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (!user) return onRequireAuth?.('quiz');
    if (!quizId) return;

    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await api.reportQuiz(quizId, {
        reason: reportReason,
        message: reportMessage,
      });
      setReportOpen(false);
      setReportMessage('');
      setSuccess('Report submitted. Thank you!');
    } catch (err) {
      if (isUnauthorized(err)) return onRequireAuth?.('quiz');
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={styles.btnWhite}
            onClick={onBack}
            disabled={busy}
          >
            {strings.COMMON.symbols.leftArrow} {strings.QUIZ_VIEW.buttons.back}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={styles.btnPrimary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const started = (await api.startCustomQuizSession(quizId)) as {
                  session_id?: string;
                };
                if (started.session_id) onPlaySession?.(started.session_id);
              } catch (err) {
                if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                setError(getApiErrorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            {strings.QUIZ_VIEW.buttons.play} {icons.common.play}
          </button>

          <button
            type="button"
            className="tv-card tv-card--hover"
            style={styles.btnWhite}
            disabled={busy}
            onClick={async () => {
              if (!user) return onRequireAuth?.('quiz');
              const nextOpen = !duelOpen;
              setDuelOpen(nextOpen);
              if (nextOpen) setReportOpen(false);
              if (nextOpen && duelFriends.length === 0) {
                setBusy(true);
                setError('');
                try {
                  const response = (await api.listFriends()) as { friends?: Friend[] };
                  setDuelFriends(Array.isArray(response?.friends) ? response.friends : []);
                } catch (err) {
                  if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                  setError(getApiErrorMessage(err));
                } finally {
                  setBusy(false);
                }
              }
            }}
          >
            {strings.QUIZ_VIEW.buttons.duel} {icons.common.bolt}
          </button>

          {canEdit && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={styles.btnPrimary}
              onClick={() => onEditQuiz?.(quizId)}
              disabled={busy}
            >
              {strings.QUIZ_VIEW.buttons.edit} {icons.common.edit}
            </button>
          )}

          {!canEdit && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={styles.btnWhite}
              disabled={busy}
              onClick={() => {
                if (!user) return onRequireAuth?.('quiz');
                setReportOpen((value: boolean) => !value);
                setDuelOpen(false);
              }}
              title="Report this quiz"
            >
              {strings.QUIZ_VIEW.buttons.report} {icons.common.finishFlag}
            </button>
          )}
        </div>

        <QuizViewStatusCards
          success={success}
          error={error}
          needsLogin={needsLogin}
          styles={styles}
          onRequireAuth={onRequireAuth}
        />

        {!quiz ? (
          <div style={styles.loading}>
            {busy ? strings.QUIZ_VIEW.states.loading : strings.QUIZ_VIEW.states.notFound}
          </div>
        ) : (
          <>
            {reportOpen && (
              <div className="tv-card" style={styles.reportCard}>
                <div style={styles.reportTitle}>
                  {icons.common.finishFlag} Report this quiz
                </div>
                <div style={styles.reportSub}>Tell us whatâ€™s wrong. Admins will review it.</div>

                <div style={styles.reportRow}>
                  <select
                    style={styles.select}
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    disabled={busy}
                  >
                    <option value="spam">Spam</option>
                    <option value="hate">Hate / abuse</option>
                    <option value="copyright">Copyright</option>
                    <option value="wrong_answers">Wrong answers</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <textarea
                  style={styles.reportTextarea}
                  value={reportMessage}
                  onChange={(event) => setReportMessage(event.target.value)}
                  placeholder="Add details (optional)â€¦"
                  disabled={busy}
                />

                <div style={styles.reportActions}>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={styles.btnPrimary}
                    onClick={() => void submitReport()}
                    disabled={busy}
                  >
                    Submit report
                  </button>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={styles.btnWhite}
                    onClick={() => setReportOpen(false)}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {duelOpen && (
              <div className="tv-card" style={styles.duelCard}>
                <div style={styles.duelTop}>
                  <div>
                    <h2 style={styles.duelTitle}>{strings.QUIZ_VIEW.duel.title}</h2>
                    <div style={styles.duelSub}>
                      {duelAllowed
                        ? strings.QUIZ_VIEW.duel.subtitle
                        : strings.QUIZ_VIEW.duel.needPublished}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={styles.btnWhite}
                    disabled={busy}
                    onClick={() => setDuelOpen(false)}
                  >
                    {strings.COMMON.buttons.close}
                  </button>
                </div>

                <div style={styles.duelRow}>
                  <select
                    style={styles.select}
                    value={duelFriendId}
                    onChange={(event) => setDuelFriendId(event.target.value)}
                    disabled={busy || !duelAllowed}
                  >
                    <option value="">{strings.QUIZ_VIEW.duel.friendPlaceholder}</option>
                    {duelFriends.map((friend) => (
                      <option key={friend.id} value={friend.id}>
                        {friend.username}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="tv-card tv-card--hover"
                    style={styles.btnPrimary}
                    disabled={busy || !duelAllowed || !duelFriendId || !onOpenDuel}
                    onClick={async () => {
                      if (!user) return onRequireAuth?.('quiz');
                      if (!duelFriendId) return;

                      setBusy(true);
                      setError('');
                      try {
                        const created = (await api.createDuel({
                          friend_user_id: duelFriendId,
                          quiz_id: quizId,
                        })) as { id?: string };
                        setDuelOpen(false);
                        setDuelFriendId('');
                        if (created.id) onOpenDuel?.(created.id);
                      } catch (err) {
                        if (isUnauthorized(err)) return onRequireAuth?.('quiz');
                        setError(getApiErrorMessage(err));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    {strings.QUIZ_VIEW.duel.send} {icons.common.rocket}
                  </button>
                </div>

                {!busy && duelFriends.length === 0 && (
                  <div style={styles.duelHint}>{strings.QUIZ_VIEW.duel.noFriends}</div>
                )}
              </div>
            )}

            <div className="tv-card" style={styles.headerCard}>
              <div style={styles.headerTop}>
                <div>
                  <div style={styles.ownerRow}>
                    <span style={styles.ownerIcon}>{icons.common.user}</span>
                    <span style={styles.ownerName}>
                      {quiz.owner?.username || strings.QUIZ_VIEW.ownerUnknown}
                    </span>
                    <span style={styles.dot}>{strings.COMMON.separators.middot}</span>
                    <span style={styles.visibility}>
                      {quiz.visibility === strings.QUIZ_VIEW.visibility.private ? (
                        <>
                          {icons.common.lock} {strings.QUIZ_VIEW.visibility.private}
                        </>
                      ) : (
                        <>
                          {icons.common.globe} {strings.QUIZ_VIEW.visibility.public}
                        </>
                      )}
                    </span>
                    {Number.isFinite(questionsCount) && (
                      <>
                        <span style={styles.dot}>{strings.COMMON.separators.middot}</span>
                        <span style={styles.visibility}>
                          {icons.common.question} {questionsCount}
                        </span>
                      </>
                    )}
                  </div>
                  <h1 style={styles.title}>{quiz.title}</h1>
                  {!!quiz.description && <p style={styles.desc}>{quiz.description}</p>}
                </div>

                <div style={styles.ratingBox}>
                  <div style={styles.ratingText}>{ratingText}</div>
                  <div style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((value) => {
                      const active = Number(ratings?.my_rating || 0) >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          style={styles.starBtnState(active)}
                          onClick={() => void onRate(value)}
                          disabled={busy}
                          title={strings.QUIZ_VIEW.rating.rateTitle(value)}
                        >
                          {icons.common.starFilled}
                        </button>
                      );
                    })}
                  </div>
                  {!user && <div style={styles.rateHint}>{strings.QUIZ_VIEW.rating.loginToRate}</div>}
                </div>
              </div>
            </div>

            <div className="tv-card" style={styles.headerCard}>
              <div style={styles.lbHeader}>
                <div>
                  <h2 style={styles.lbTitle}>{strings.QUIZ_VIEW.leaderboard.title}</h2>
                  {Number.isFinite(Number(leaderboard?.my_best_score)) && (
                    <div style={styles.lbMine}>
                      {strings.QUIZ_VIEW.leaderboard.myBestPrefix} {icons.common.medal}{' '}
                      {leaderboard?.my_best_score}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="tv-card tv-card--hover"
                  style={styles.btnWhite}
                  disabled={busy}
                  onClick={() => {
                    api.invalidatePublicQuizLeaderboard?.(quizId);
                    void load();
                  }}
                >
                  {strings.COMMON.buttons.refresh} {icons.common.refresh}
                </button>
              </div>

              <div style={styles.lbList}>
                {(leaderboard?.entries || []).slice(0, 10).map((entry) => (
                  <div key={entry.user_id} style={styles.lbRow}>
                    <span style={styles.lbRank}>
                      {strings.COMMON.symbols.hash}
                      {entry.rank_position}
                    </span>
                    <span style={styles.lbName}>{entry.username || strings.COMMON.playerFallback}</span>
                    <span style={styles.lbScore}>
                      {icons.common.medal} {entry.best_score}
                    </span>
                  </div>
                ))}

                {(!leaderboard?.entries || leaderboard.entries.length === 0) && (
                  <div style={styles.lbEmpty}>
                    {leaderboard?.not_configured
                      ? strings.QUIZ_VIEW.leaderboard.notConfigured
                      : strings.QUIZ_VIEW.leaderboard.empty}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
