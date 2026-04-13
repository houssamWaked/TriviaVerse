import colors from '../../constants/colors';

/**
 * Get the color/shape theme for a story-mode option card by index.
 * @param index Option index (0-based).
 * @returns Theme object containing gradient background and a shape glyph.
 */
export const getStoryOptionTheme = (index: number) => {
  if (index === 0)
    return {
      bg: `linear-gradient(90deg, ${colors.accent.red} 0%, #ff2d55 100%)`,
      shape: '△',
    };
  if (index === 1)
    return {
      bg: `linear-gradient(90deg, ${colors.accent.blue} 0%, #2563eb 100%)`,
      shape: '◇',
    };
  if (index === 2)
    return {
      bg: `linear-gradient(90deg, ${colors.accent.yellow} 0%, #f59e0b 100%)`,
      shape: '○',
    };
  return {
    bg: `linear-gradient(90deg, ${colors.accent.green} 0%, #16a34a 100%)`,
    shape: '□',
  };
};

/**
 * Style map for the play-session UI across modes (default/millionaire/story).
 */
const PlaySessionStyle: any = {
  page: {
    width: '100%',
    background: colors.gradients.main,
    display: 'flex',
    justifyContent: 'center',
    padding: '36px 18px 74px',
  },

  container: {
    width: '100%',
    maxWidth: 980,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  containerStory: {
    width: '100%',
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },

  pills: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  pill: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
    fontSize: 12,
    fontWeight: 950,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)',
  },

  pillsCentered: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  card: {
    background: colors.neutral.white,
    borderRadius: 26,
    padding: 20,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
  },

  qText: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.4,
    lineHeight: 1.35,
  },

  options: {
    marginTop: 16,
    display: 'grid',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 12,
  },

  optionBtn: {
    width: '100%',
    textAlign: 'left',
    padding: 14,
    borderRadius: 20,
    border: `1px solid ${colors.neutral[200]}`,
    background: colors.neutral.white,
    cursor: 'pointer',
    boxShadow: '0 14px 30px rgba(0,0,0,0.10)',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },

  optionBtnActive: {
    border: `1px solid ${colors.primary[200]}`,
    background: colors.primary[50],
  },

  optionBtnState: (
    arg:
      | boolean
      | {
          active?: boolean;
          state?: string;
          disabled?: boolean;
        }
  ) => {
    const isObj = !!arg && typeof arg === 'object';
    const isActive = isObj ? !!arg.active : !!arg;
    const state = isObj ? String(arg.state || 'idle') : 'idle'; // 'idle' | 'correct' | 'wrong' | 'dim'
    const disabled = isObj ? !!arg.disabled : false;

    const correct = state === 'correct';
    const wrong = state === 'wrong';
    const dim = state === 'dim';

    const border = correct
      ? '1px solid rgba(34,197,94,0.45)'
      : wrong
        ? '1px solid rgba(239,68,68,0.45)'
        : isActive
          ? `1px solid ${colors.primary[200]}`
          : `1px solid ${colors.neutral[200]}`;

    const background = correct
      ? 'rgba(34,197,94,0.14)'
      : wrong
        ? 'rgba(239,68,68,0.14)'
        : isActive
          ? colors.primary[50]
          : colors.neutral.white;

    return {
      width: '100%',
      textAlign: 'left',
      padding: 14,
      borderRadius: 20,
      border,
      background,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: dim ? 0.7 : 1,
      boxShadow: '0 14px 30px rgba(0,0,0,0.10)',
      display: 'flex',
      gap: 12,
      alignItems: 'center',
    };
  },

  optionResultIcon: {
    marginLeft: 'auto',
    fontSize: 18,
    fontWeight: 950,
  },

  optionLabel: {
    width: 34,
    height: 34,
    borderRadius: 14,
    background: colors.neutral[100],
    border: `1px solid ${colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 950,
    color: colors.neutral[800],
    flex: '0 0 auto',
  },

  optionText: {
    fontSize: 14,
    fontWeight: 850,
    color: colors.neutral[900],
    lineHeight: 1.35,
  },

  actions: {
    marginTop: 16,
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },

  primaryBtn: {
    height: 46,
    padding: '0 18px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 18px 34px rgba(139,44,255,0.28)',
  },

  primaryBtnMain: {
    height: 46,
    padding: '0 18px',
    borderRadius: 16,
    border: 'none',
    cursor: 'pointer',
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 950,
    boxShadow: '0 18px 34px rgba(139,44,255,0.28)',
    background: colors.gradients.main,
  },

  secondaryBtn: {
    height: 46,
    padding: '0 16px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral[900],
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
  },

  secondaryBtnWhite: {
    height: 46,
    padding: '0 16px',
    borderRadius: 16,
    border: `1px solid ${colors.neutral[200]}`,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral[900],
    boxShadow: '0 12px 26px rgba(0,0,0,0.10)',
    background: colors.neutral.white,
  },

  result: {
    marginTop: 14,
    padding: '10px 12px',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 950,
  },

  resultOk: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.35)',
    color: colors.accent.green,
  },

  resultBad: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: colors.accent.red,
  },

  resultState: (isCorrect: boolean | null | undefined) => ({
    marginTop: 14,
    padding: '10px 12px',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 950,
    ...(isCorrect
      ? {
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.35)',
          color: colors.accent.green,
        }
      : {
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.35)',
          color: colors.accent.red,
        }),
  }),

  bonus: {
    marginLeft: 10,
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(255,204,0,0.16)',
    border: '1px solid rgba(255,204,0,0.38)',
    color: colors.neutral[900],
    fontSize: 12,
    fontWeight: 950,
  },

  errorCard: {
    background: colors.neutral.white,
    borderRadius: 22,
    padding: 16,
    border: `1px solid ${colors.secondary[100]}`,
    color: colors.secondary[700],
    fontSize: 13,
    fontWeight: 850,
    boxShadow: '0 18px 50px rgba(0,0,0,0.16)',
  },

  loading: {
    textAlign: 'center',
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 850,
    textShadow: '0 10px 26px rgba(0,0,0,0.16)',
    padding: '22px 0',
  },

  audiencePollCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    border: '1px solid rgba(139,44,255,0.22)',
    background: 'rgba(139,44,255,0.08)',
    fontSize: 13,
    fontWeight: 900,
    color: colors.primary[800],
  },

  phoneHintCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.24)',
    background: 'rgba(255,255,255,0.14)',
    fontSize: 13,
    fontWeight: 900,
    color: colors.neutral[900],
  },

  lockCard: {
    maxWidth: 560,
    margin: '18px auto 0',
    borderRadius: 22,
    padding: 26,
    background: colors.neutral.white,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  lockTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },

  lockText: {
    margin: 0,
    fontSize: 14,
    fontWeight: 750,
    color: colors.neutral[600],
    lineHeight: 1.55,
  },

  doneCard: {
    background: colors.neutral.white,
    borderRadius: 26,
    padding: 22,
    boxShadow: '0 22px 60px rgba(0,0,0,0.18)',
    textAlign: 'center',
  },

  doneTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.6,
  },

  doneText: {
    margin: '10px 0 18px',
    fontSize: 14,
    fontWeight: 850,
    color: colors.neutral[700],
  },

  /* ================= Millionaire variant (UNCHANGED) ================= */
  millionaireShell: {
    width: '100%',
    maxWidth: 1180,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  millionaireTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  millionaireExitBtn: {
    height: 44,
    padding: '0 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.26)',
    background: 'rgba(255,255,255,0.14)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 950,
    color: colors.neutral.white,
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 40px rgba(0,0,0,0.14)',
    backdropFilter: 'blur(10px)',
  },
  millionairePrizePill: {
    padding: '10px 14px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.26)',
    background: 'rgba(255,255,255,0.14)',
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 950,
    boxShadow:
      'inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 40px rgba(0,0,0,0.14)',
    backdropFilter: 'blur(10px)',
    whiteSpace: 'nowrap',
  },
  millionaireGrid: {
    display: 'flex',
    gap: 18,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  millionaireLeftCol: {
    flex: '1 1 640px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 'min(320px, 100%)',
  },
  millionaireCard: {
    borderRadius: 26,
    padding: '22px 22px 18px',
    border: '1px solid rgba(255,255,255,0.22)',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.16) 100%)',
    boxShadow: '0 26px 70px rgba(0,0,0,0.22)',
    backdropFilter: 'blur(10px)',
    color: colors.neutral.white,
  },
  millionaireCount: {
    fontSize: 14,
    fontWeight: 950,
    opacity: 0.9,
    textAlign: 'center',
  },
  millionaireQuestion: {
    marginTop: 10,
    fontSize: 'clamp(22px, 4.6vw, 34px)',
    fontWeight: 950,
    letterSpacing: -0.8,
    lineHeight: 1.18,
    textAlign: 'center',
    textShadow: '0 14px 40px rgba(0,0,0,0.18)',
  },
  millionaireOptions: {
    marginTop: 18,
    display: 'grid',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 12,
  },
  millionaireOptionBtnState: (suggested: boolean, disabled: boolean) => ({
    width: '100%',
    textAlign: 'left',
    padding: 16,
    borderRadius: 20,
    border: suggested
      ? '1px solid rgba(255,204,0,0.78)'
      : '1px solid rgba(255,255,255,0.30)',
    background: suggested ? 'rgba(255,204,0,0.20)' : 'rgba(255,255,255,0.18)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 18px 44px rgba(0,0,0,0.16)',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    color: colors.neutral.white,
    backdropFilter: 'blur(10px)',
    opacity: disabled ? 0.45 : 1,
  }),
  millionaireOptionLabel: {
    width: 36,
    height: 36,
    borderRadius: 14,
    background: 'rgba(255,204,0,0.30)',
    border: '1px solid rgba(255,204,0,0.60)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 950,
    color: colors.accent.yellow,
    flex: '0 0 auto',
  },
  millionaireOptionText: {
    fontSize: 15,
    fontWeight: 950,
    color: colors.neutral.white,
    lineHeight: 1.3,
  },
  millionaireHint: {
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.30)',
    background: 'rgba(255,255,255,0.18)',
    fontSize: 13,
    fontWeight: 950,
    color: colors.neutral.white,
  },
  millionaireLifelinesCard: {
    borderRadius: 26,
    padding: 18,
    border: '1px solid rgba(255,255,255,0.22)',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.14) 100%)',
    boxShadow: '0 26px 70px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(10px)',
    color: colors.neutral.white,
  },
  millionaireLifelinesTitle: {
    fontSize: 14,
    fontWeight: 950,
    opacity: 0.95,
  },
  millionaireLifelinesRow: {
    marginTop: 12,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
    gap: 12,
  },
  millionaireLifelineBtn: {
    height: 76,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.28)',
    background: 'rgba(255,255,255,0.16)',
    cursor: 'pointer',
    boxShadow: '0 18px 44px rgba(0,0,0,0.16)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: colors.neutral.white,
    fontWeight: 950,
  },
  millionaireLifelineIcon: { fontSize: 18 },
  millionaireLifelineText: { fontSize: 12, opacity: 0.95 },

  millionaireLadderCard: {
    flex: '1 1 340px',
    minWidth: 'min(300px, 100%)',
    borderRadius: 26,
    padding: 18,
    border: '1px solid rgba(255,255,255,0.22)',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.14) 100%)',
    boxShadow: '0 26px 70px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(10px)',
    color: colors.neutral.white,
  },
  millionaireLadderTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 950,
    opacity: 0.95,
  },
  millionaireLadderList: {
    marginTop: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  millionaireLadderRowState: (active: boolean) => ({
    padding: '10px 12px',
    borderRadius: 18,
    border: active
      ? '1px solid rgba(255,204,0,0.55)'
      : '1px solid rgba(255,255,255,0.22)',
    background: active ? 'rgba(255,204,0,0.20)' : 'rgba(255,255,255,0.14)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
  }),
  millionaireLadderNum: {
    fontSize: 13,
    fontWeight: 950,
    opacity: 0.9,
  },
  millionaireLadderValue: {
    fontSize: 13,
    fontWeight: 950,
  },

  /* ================= Story variant (UPDATED) ================= */
  storyTop: {
    width: '100%',
    maxWidth: 980,
    margin: '0 auto 14px',
    color: colors.neutral.white,
  },

  storyTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  storyCount: {
    fontSize: 14,
    fontWeight: 950,
    opacity: 0.95,
    textShadow: '0 10px 26px rgba(0,0,0,0.16)',
  },

  storyDots: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
  },

  // ✅ single active dot (green), others white
  storyDotItem: (active: boolean) => ({
    width: 10,
    height: 10,
    borderRadius: 999,
    background: active ? colors.accent.green : 'rgba(255,255,255,0.55)',
    border: active ? 'none' : '1px solid rgba(255,255,255,0.55)',
    boxShadow: active ? '0 10px 18px rgba(34,197,94,0.28)' : 'none',
  }),

  storyTrack: {
    marginTop: 10,
    height: 14,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },

  storyFillWidth: (pct: number) => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: 999,
    background: colors.accent.green,
    boxShadow: '0 10px 22px rgba(34,197,94,0.28)',
    transition: 'width 220ms ease',
  }),

  storyCard: {
    width: '100%',
    maxWidth: 980,
    margin: '0 auto',
    background: colors.neutral.white,
    borderRadius: 28,
    padding: '28px 24px',
    boxShadow: '0 26px 70px rgba(0,0,0,0.22)',
    textAlign: 'center',
  },

  storyEmoji: {
    width: 58,
    height: 58,
    margin: '0 auto 10px',
    borderRadius: 18,
    background: colors.neutral[50],
    border: `1px solid ${colors.neutral[200]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 30,
  },

  storyQuestion: {
    margin: '6px auto 0',
    maxWidth: 820,
    fontSize: 'clamp(22px, 4.6vw, 36px)',
    fontWeight: 950,
    color: colors.neutral[900],
    letterSpacing: -0.8,
    lineHeight: 1.15,
  },

  // ✅ 2x2 grid like the left screenshot
  storyOptions: {
    marginTop: 22,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 18,
  },

  storyOptionBtnState: (selected: boolean) => ({
    width: '100%',
    padding: 0,
    borderRadius: 24,
    border: 'none',
    cursor: 'pointer',
    boxShadow: selected
      ? '0 0 0 2px rgba(255,255,255,0.95), 0 22px 60px rgba(0,0,0,0.20)'
      : '0 22px 60px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    textAlign: 'left',
    transform: selected ? 'translateY(-1px)' : 'none',
  }),

  storyOptionInnerBg: (bg: string) => ({
    minHeight: 108,
    padding: 20,
    borderRadius: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: bg,
  }),

  storyShape: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.22)',
    border: '1px solid rgba(255,255,255,0.34)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.neutral.white,
    fontSize: 16,
    fontWeight: 950,
  },

  storyOptionText: {
    fontSize: 18,
    fontWeight: 950,
    color: colors.neutral.white,
    textAlign: 'center',
    letterSpacing: -0.2,
    lineHeight: 1.2,
    padding: '0 46px',
  },

  storyResultIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    color: colors.neutral.white,
    fontSize: 22,
    fontWeight: 950,
    textShadow: '0 10px 26px rgba(0,0,0,0.18)',
  },

  storyToastState: (isCorrect: boolean | null | undefined) => ({
    marginTop: 14,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 950,
    ...(isCorrect
      ? {
          background: 'rgba(34,197,94,0.14)',
          border: '1px solid rgba(34,197,94,0.30)',
          color: colors.accent.green,
        }
      : {
          background: 'rgba(239,68,68,0.14)',
          border: '1px solid rgba(239,68,68,0.30)',
          color: colors.accent.red,
        }),
  }),

  storyBottom: {
    marginTop: 18,
    display: 'flex',
    justifyContent: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },

  // ✅ only 2 pills (Correct + Accuracy), like left
  storyBottomPill: {
    padding: '12px 16px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.18)',
    border: '1px solid rgba(255,255,255,0.22)',
    color: colors.neutral.white,
    fontSize: 13,
    fontWeight: 950,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)',
  },
};

export default PlaySessionStyle;

