import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import CreateQuizPageStyle from '@/Styles/ComponentStyles/CreateQuizPageStyle';

type CreateQuizLockedCardProps = {
  onRequireAuth?: () => void;
};

export default function CreateQuizLockedCard({ onRequireAuth }: CreateQuizLockedCardProps) {
  return (
    <div className="tv-card" style={CreateQuizPageStyle.lockCard}>
      <h2 style={CreateQuizPageStyle.lockTitle}>{STRINGS.CREATE_QUIZ.locked.title}</h2>
      <p style={CreateQuizPageStyle.lockText}>{STRINGS.CREATE_QUIZ.locked.subtitle}</p>
      <button
        type="button"
        className="tv-card tv-card--hover"
        style={CreateQuizPageStyle.primaryBtnMain}
        onClick={() => onRequireAuth?.()}
      >
        {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
      </button>
    </div>
  );
}

