import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import BlitzStyle from '@/Styles/ComponentStyles/BlitzStyle';

type BlitzFeatureCardsProps = {
  seconds: number;
};

export default function BlitzFeatureCards({ seconds }: BlitzFeatureCardsProps) {
  return (
    <div className="tv-blitz-feature-grid" style={BlitzStyle.featureGrid}>
      {[
        {
          icon: ICONS.common.timer,
          title: STRINGS.BLITZ.formatSeconds(seconds),
          sub: STRINGS.BLITZ.stats.timeLimit,
        },
        {
          icon: ICONS.common.bolt,
          title: STRINGS.BLITZ.stats.fast,
          sub: STRINGS.BLITZ.stats.paced,
        },
        {
          icon: ICONS.common.check,
          title: STRINGS.BLITZ.stats.questionsCount,
          sub: STRINGS.BLITZ.stats.questions,
        },
      ].map((s) => (
        <div key={s.sub} className="tv-card" style={BlitzStyle.featureCard}>
          <div style={BlitzStyle.featureIcon}>{s.icon}</div>
          <div style={BlitzStyle.featureValue}>{s.title}</div>
          <div style={BlitzStyle.featureLabel}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
