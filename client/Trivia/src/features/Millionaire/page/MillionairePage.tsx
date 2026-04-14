import React, { useState } from 'react';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import { api } from '@/api';
import ModeStartStyle from '@/Styles/ComponentStyles/ModeStartStyle';
import MillionaireStyle from '@/Styles/ComponentStyles/MillionaireStyle';
import { getApiErrorMessage } from '@/utils/apiError';
import MillionaireLadderConfig from '@/features/Millionaire/components/MillionaireLadderConfig';
import { useMillionaireConfig } from '@/features/Millionaire/hooks/useMillionaireConfig';

type AppUser = {
  id?: string;
  username?: string;
} | null;

export type MillionaireProps = {
  user?: AppUser;
  onRequireAuth?: (...args: [string?]) => void;
  onNavigateHome?: () => void;
  onPlaySession?: (...args: [string?]) => void;
};

/**
 * Millionaire mode start page: loads config and starts a millionaire session.
 * @param user Current user snapshot (controls auth CTA).
 * @param onPlaySession Callback invoked with a started session id.
 * @returns React element.
 */
export default function MillionairePage({
  user,
  onRequireAuth,
  onNavigateHome,
  onPlaySession,
}: MillionaireProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const {
    ladders,
    ladderId,
    setLadderId,
    showAdvanced,
    setShowAdvanced,
    selectedLadder,
  } = useMillionaireConfig();

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api.startMillionaireSession(
        ladderId ? { ladder_id: ladderId } : {}
      );
      onPlaySession?.(res.session_id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={ModeStartStyle.page}>
      <div style={ModeStartStyle.container}>
        <div style={ModeStartStyle.hero}>
          <div style={MillionaireStyle.crown}>{ICONS.common.crown}</div>
          <h1 style={ModeStartStyle.title}>{STRINGS.MILLIONAIRE.title}</h1>
          <p style={ModeStartStyle.subtitle}>{STRINGS.MILLIONAIRE.subtitle}</p>
        </div>

        <div className="tv-card" style={MillionaireStyle.stageCard}>
          {!!error && <div style={MillionaireStyle.error}>{error}</div>}

          <div style={MillionaireStyle.stageGrid}>
            <div>
              <div style={MillionaireStyle.sectionTitle}>
                {STRINGS.MILLIONAIRE.rulesTitle}
              </div>

              <div style={MillionaireStyle.rulesList}>
                {STRINGS.MILLIONAIRE.rules.map((text) => (
                  <div key={text} style={MillionaireStyle.ruleRow}>
                    <span style={MillionaireStyle.ruleDot} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <MillionaireLadderConfig
              ladders={ladders}
              ladderId={ladderId}
              busy={busy}
              showAdvanced={showAdvanced}
              onToggleAdvanced={() => setShowAdvanced((value) => !value)}
              onLadderIdChange={setLadderId}
              selectedLadderName={selectedLadder?.name}
            />
          </div>

          <div style={MillionaireStyle.actions}>
            <button
              type="button"
              className="tv-card tv-card--hover"
              style={MillionaireStyle.startBtn}
              onClick={start}
              disabled={busy}
            >
              {STRINGS.MILLIONAIRE.buttons.startGame}
            </button>

            {!user ? (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={MillionaireStyle.secondaryBtn}
                onClick={() => onRequireAuth?.('millionaire')}
                disabled={busy}
              >
                Login to save progress
              </button>
            ) : (
              <button
                type="button"
                className="tv-card tv-card--hover"
                style={MillionaireStyle.secondaryBtn}
                onClick={onNavigateHome}
                disabled={busy}
              >
                {STRINGS.COMMON.backHome}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
