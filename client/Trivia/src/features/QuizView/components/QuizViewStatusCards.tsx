import { STRINGS } from '@/constants/strings';
import type { CSSProperties } from 'react';
import type { QuizViewPageProps } from '@/features/QuizView/types';

type QuizViewStatusStyles = {
  successCard: CSSProperties;
  errorCard: CSSProperties;
  btnWhiteMt12: CSSProperties;
};

type QuizViewStatusCardsProps = {
  success: string;
  error: string;
  needsLogin: boolean;
  styles: QuizViewStatusStyles;
  onRequireAuth?: QuizViewPageProps['onRequireAuth'];
};

const strings = STRINGS;

export default function QuizViewStatusCards({
  success,
  error,
  needsLogin,
  styles,
  onRequireAuth,
}: QuizViewStatusCardsProps) {
  return (
    <>
      {!!success && (
        <div className="tv-card" style={styles.successCard}>
          {success}
        </div>
      )}

      {!!error && (
        <div className="tv-card" style={styles.errorCard}>
          <div>{error}</div>
          {needsLogin && (
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={styles.btnWhiteMt12}
              onClick={() => onRequireAuth?.('quiz')}
            >
              {strings.QUIZ_VIEW.buttons.loginToView}
            </button>
          )}
        </div>
      )}
    </>
  );
}
