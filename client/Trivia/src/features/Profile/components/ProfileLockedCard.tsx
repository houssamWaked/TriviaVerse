import React from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import ProfileStyle from '@/Styles/ComponentStyles/ProfileStyle';

type ProfileLockedCardProps = {
  onRequireAuth?: () => void;
  onNavigateHome?: () => void;
};

export default function ProfileLockedCard({ onRequireAuth, onNavigateHome }: ProfileLockedCardProps) {
  return (
    <div style={ProfileStyle.page}>
      <div style={ProfileStyle.container}>
        <div className="tv-card" style={ProfileStyle.lockCard}>
          <h2 style={ProfileStyle.lockTitle}>{STRINGS.PROFILE.locked.title}</h2>
          <p style={ProfileStyle.lockText}>{STRINGS.PROFILE.locked.subtitle}</p>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={ProfileStyle.primaryBtnMain}
            onClick={() => onRequireAuth?.()}
          >
            {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={ProfileStyle.secondaryBtnWhite}
            onClick={onNavigateHome}
          >
            {STRINGS.COMMON.buttons.home}
          </button>
        </div>
      </div>
    </div>
  );
}
