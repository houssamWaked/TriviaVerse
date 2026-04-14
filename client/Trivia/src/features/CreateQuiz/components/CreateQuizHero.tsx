import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import CreateQuizPageStyle from '@/Styles/ComponentStyles/CreateQuizPageStyle';

export default function CreateQuizHero() {
  return (
    <div style={CreateQuizPageStyle.hero}>
      <div style={CreateQuizPageStyle.heroBadge}>
        <span style={CreateQuizPageStyle.heroBadgeIcon}>{ICONS.common.palette}</span>
        <span style={CreateQuizPageStyle.heroBadgeText}>
          {STRINGS.CREATE_QUIZ.hero.badgeText}
        </span>
        <span style={CreateQuizPageStyle.heroBadgeDot}>{ICONS.brand.sparkles}</span>
      </div>
      <h1 style={CreateQuizPageStyle.heroTitle}>
        {STRINGS.CREATE_QUIZ.hero.titlePrefix}{' '}
        <span style={CreateQuizPageStyle.heroTitleAccent}>
          {STRINGS.CREATE_QUIZ.hero.titleAccent}
        </span>
      </h1>
      <p style={CreateQuizPageStyle.heroSubtitle}>{STRINGS.CREATE_QUIZ.hero.subtitle}</p>
    </div>
  );
}

