import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import StatCard from '@/Cards/HomeCards/StatCard';
import HomeHeroStyle from '@/Styles/ComponentStyles/HomeHeroStyle';

export default function HomeHero({
  metrics = STRINGS.HOME.statsDefaults,
  onStartPlaying,
  onCreateQuiz,
}) {
  return (
    <section style={HomeHeroStyle.section}>
      <div style={HomeHeroStyle.container}>
        <div style={HomeHeroStyle.badge}>
          <span style={HomeHeroStyle.badgeIcon}>{ICONS.common.rocket}</span>
          <span style={HomeHeroStyle.badgeText}>{STRINGS.HOME.badge.text}</span>
          <span style={HomeHeroStyle.badgeDot}>{ICONS.common.globe}</span>
        </div>

        <h1 style={HomeHeroStyle.title}>
          <span style={HomeHeroStyle.titleTop}>{STRINGS.HOME.hero.titleTop}</span>
          <span style={HomeHeroStyle.titleBottom}>
            <span style={HomeHeroStyle.triviaWord}>
              {STRINGS.HOME.hero.titleTrivia}
            </span>
            <span style={HomeHeroStyle.exclamation}>
              {STRINGS.COMMON.symbols.exclamation}
            </span>
            <span style={HomeHeroStyle.party}>{ICONS.common.party}</span>
          </span>
        </h1>

        <p style={HomeHeroStyle.subtitle}>
          {STRINGS.HOME.hero.subtitleLine1}
          <br />
          {STRINGS.HOME.hero.subtitleLine2}{' '}
          <span style={HomeHeroStyle.subtitleEmoji}>
            {ICONS.common.brain} {ICONS.brand.sparkles}
          </span>
        </p>

        <div style={HomeHeroStyle.ctaRow}>
          <button
            type="button"
            style={HomeHeroStyle.primaryBtn}
            onClick={onStartPlaying}
          >
            <span style={HomeHeroStyle.btnIcon}>{ICONS.common.play}</span>
            {STRINGS.HOME.ctas.startPlaying}
          </button>

          <button
            type="button"
            style={HomeHeroStyle.secondaryBtn}
            onClick={onCreateQuiz}
          >
            <span style={HomeHeroStyle.btnIcon}>{ICONS.brand.sparkles}</span>
            {STRINGS.HOME.ctas.createQuiz}
          </button>
        </div>

        <div style={HomeHeroStyle.cardsGrid}>
          <StatCard
            icon={ICONS.common.people}
            value={metrics.active_players}
            label={STRINGS.HOME.stats.activePlayers}
            valueColor={colors.accent.blue}
          />
          <StatCard
            icon={ICONS.common.question}
            value={metrics.questions}
            label={STRINGS.HOME.stats.questions}
            valueColor={colors.accent.green}
          />
          <StatCard
            icon={ICONS.brand.sparkles}
            value={metrics.quizzes_created}
            label={STRINGS.HOME.stats.quizzesCreated}
            valueColor={colors.primary[300]}
          />
          <StatCard
            icon={ICONS.common.party}
            value={metrics.fun_level}
            label={STRINGS.HOME.stats.funLevel}
            valueColor={colors.secondary[400]}
          />
        </div>
      </div>
    </section>
  );
}
