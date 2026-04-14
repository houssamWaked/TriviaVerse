import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import FriendsStyle from '@/Styles/ComponentStyles/FriendsStyle';
import type { FriendsProps } from '@/features/Friends/types';

type FriendsLockedCardProps = Pick<FriendsProps, 'onRequireAuth' | 'onNavigateHome'>;

export function FriendsLockedCard({ onRequireAuth, onNavigateHome }: FriendsLockedCardProps) {
  return (
    <div style={FriendsStyle.page}>
      <div style={FriendsStyle.container}>
        <div className="tv-card" style={FriendsStyle.lockCard}>
          <h2 style={FriendsStyle.lockTitle}>{STRINGS.FRIENDS.locked.title}</h2>
          <p style={FriendsStyle.lockText}>{STRINGS.FRIENDS.locked.subtitle}</p>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={FriendsStyle.primaryBtnMain}
            onClick={() => onRequireAuth?.('friends')}
          >
            {STRINGS.COMMON.joinLogin} {ICONS.common.rocket}
          </button>
          <button
            type="button"
            className="tv-card tv-card--hover"
            style={FriendsStyle.secondaryBtnWhite}
            onClick={onNavigateHome}
          >
            {STRINGS.COMMON.buttons.home}
          </button>
        </div>
      </div>
    </div>
  );
}
