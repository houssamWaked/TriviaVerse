import React from 'react';
import { STRINGS } from '@/constants/strings';
import MillionaireStyle from '@/Styles/ComponentStyles/MillionaireStyle';
import { type MillionaireLadder } from '@/features/Millionaire/hooks/useMillionaireConfig';

type MillionaireLadderConfigProps = {
  ladders: MillionaireLadder[];
  ladderId: string;
  busy: boolean;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onLadderIdChange: (...args: [string]) => void;
  selectedLadderName?: string | null;
};

/**
 * Millionaire ladder configuration block (advanced toggle + ladder selector).
 * @param ladders Available prize ladders from backend config.
 * @param ladderId Selected ladder id.
 * @returns React element or null when no ladders are available.
 */
export default function MillionaireLadderConfig({
  ladders,
  ladderId,
  busy,
  showAdvanced,
  onToggleAdvanced,
  onLadderIdChange,
  selectedLadderName,
}: MillionaireLadderConfigProps) {
  if (ladders.length === 0) return null;

  return (
    <div>
      <div style={MillionaireStyle.sectionTitle}>
        {STRINGS.MILLIONAIRE.ladder.configLabel}
      </div>

      <button
        type="button"
        className="tv-card tv-card--hover"
        style={MillionaireStyle.toggleBtn}
        onClick={onToggleAdvanced}
        disabled={busy}
      >
        {showAdvanced
          ? STRINGS.MILLIONAIRE.ladder.toggleHide
          : STRINGS.MILLIONAIRE.ladder.toggleShow}
      </button>

      {showAdvanced && (
        <div style={MillionaireStyle.ladderBox}>
          <select
            style={MillionaireStyle.select}
            value={ladderId}
            onChange={(e) => onLadderIdChange(e.target.value)}
            disabled={busy}
          >
            {ladders.map((ladder) => (
              <option key={ladder.id} value={ladder.id}>
                {ladder.name}
              </option>
            ))}
          </select>

          <div style={MillionaireStyle.ladderCurrent}>
            {STRINGS.MILLIONAIRE.ladder.currentPrefix}{' '}
            {selectedLadderName || STRINGS.MILLIONAIRE.ladder.defaultName}
          </div>
        </div>
      )}
    </div>
  );
}
