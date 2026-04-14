import { useCallback, useMemo, useState } from 'react';

type UsePlaySessionShareParams = {
  scoreDisplay: string;
  modeLabel: string;
  isStory: boolean;
  storyLevelNumber: number | null;
  classicLevelNum?: number | null;
};

export function usePlaySessionShare({
  scoreDisplay,
  modeLabel,
  isStory,
  storyLevelNumber,
  classicLevelNum,
}: UsePlaySessionShareParams) {
  const [shareMessage, setShareMessage] = useState('');

  const shareText = useMemo(() => {
    const parts = [];
    parts.push(`?? I just scored ${scoreDisplay} in ${modeLabel}!`);
    if (isStory && Number.isFinite(Number(storyLevelNumber))) {
      parts.push(`Level ${Number(storyLevelNumber)}`);
    }
    if (classicLevelNum) {
      parts.push(`Level ${Number(classicLevelNum)}`);
    }
    parts.push('Can you beat me on TriviaVerse? ??');
    return parts.join(' ');
  }, [classicLevelNum, isStory, modeLabel, scoreDisplay, storyLevelNumber]);

  const shareUrl = useMemo(() => {
    try {
      return window.location?.origin || '';
    } catch {
      return '';
    }
  }, []);

  const doShare = useCallback(async () => {
    const payloadText = shareUrl ? `${shareText}\n${shareUrl}` : shareText;
    setShareMessage('');

    try {
      if (navigator?.share) {
        await navigator.share({
          title: 'TriviaVerse',
          text: shareText,
          url: shareUrl || undefined,
        });
        setShareMessage('Shared!');
        return;
      }
    } catch {
      // fall back to clipboard
    }

    try {
      await navigator.clipboard.writeText(payloadText);
      setShareMessage('Copied to clipboard!');
    } catch {
      setShareMessage('Copy failed — your browser blocked clipboard access.');
    }
  }, [shareText, shareUrl]);

  return {
    shareMessage,
    setShareMessage,
    shareText,
    doShare,
  };
}
