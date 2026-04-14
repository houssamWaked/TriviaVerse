import React from 'react';
import { STRINGS } from '@/constants/strings';
import ClassicStyle from '@/Styles/ComponentStyles/ClassicStyle';

type ClassicStatsGridProps = {
  categoriesCount: number;
  questionsTotal?: number | null;
};

export default function ClassicStatsGrid({
  categoriesCount,
  questionsTotal,
}: ClassicStatsGridProps) {
  return (
    <div className="tv-classic-stats-grid" style={ClassicStyle.statsGrid}>
      {[
        {
          value: String(categoriesCount || 0),
          label: STRINGS.CLASSIC.stats.categories,
        },
        {
          value:
            questionsTotal != null
              ? `${questionsTotal.toLocaleString()}+`
              : STRINGS.COMMON.separators.emDash,
          label: STRINGS.CLASSIC.stats.totalQuestions,
        },
        {
          value: STRINGS.COMMON.separators.infinity,
          label: STRINGS.CLASSIC.stats.endlessFun,
        },
      ].map((s) => (
        <div key={s.label} className="tv-card" style={ClassicStyle.statsCard}>
          <div style={ClassicStyle.statsValue}>{s.value}</div>
          <div style={ClassicStyle.statsLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
