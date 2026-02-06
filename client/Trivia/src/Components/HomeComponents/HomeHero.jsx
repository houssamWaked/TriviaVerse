import HomeHeroStyle from '../../Styles/ComponentStyles/HomeHeroStyle';
import colors from '../../constants/colors';
import StatCard from '../../Cards/HomeCards/StatCard';
export default function HomeHero({
  metrics = {
    active_players: '1M+',
    questions: '50K+',
    quizzes_created: '25K+',
    fun_level: '100%',
  },
  onStartPlaying,
  onCreateQuiz,
}) {
  return (
    <section style={HomeHeroStyle.section}>
      <div style={HomeHeroStyle.container}>
        {/* Top badge */}
        <div style={HomeHeroStyle.badge}>
          <span style={HomeHeroStyle.badgeIcon}>🚀</span>
          <span style={HomeHeroStyle.badgeText}>1M+ Players Worldwide!</span>
          <span style={HomeHeroStyle.badgeDot}>🌍</span>
        </div>

        {/* Headline */}
        <h1 style={HomeHeroStyle.title}>
          <span style={HomeHeroStyle.titleTop}>Let's Play</span>
          <span style={HomeHeroStyle.titleBottom}>
            <span style={HomeHeroStyle.triviaWord}>Trivia</span>
            <span style={HomeHeroStyle.exclamation}>!</span>
            <span style={HomeHeroStyle.party}>🎉</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p style={HomeHeroStyle.subtitle}>
          Test your brain, challenge friends, and become a quiz
          <br />
          champion! <span style={HomeHeroStyle.subtitleEmoji}>🧠 ✨</span>
        </p>

        {/* CTAs */}
        <div style={HomeHeroStyle.ctaRow}>
          <button
            type="button"
            style={HomeHeroStyle.primaryBtn}
            onClick={onStartPlaying}
          >
            <span style={HomeHeroStyle.btnIcon}>▶</span>
            Start Playing!
          </button>

          <button
            type="button"
            style={HomeHeroStyle.secondaryBtn}
            onClick={onCreateQuiz}
          >
            <span style={HomeHeroStyle.btnIcon}>✨</span>
            Create Quiz
          </button>
        </div>

        {/* Stats cards */}
        <div style={HomeHeroStyle.cardsGrid}>
          <StatCard
            icon="👥"
            value={metrics.active_players}
            label="Active Players"
            valueColor={colors.accent.blue}
          />
          <StatCard
            icon="❓"
            value={metrics.questions}
            label="Questions"
            valueColor={colors.accent.green}
          />
          <StatCard
            icon="✨"
            value={metrics.quizzes_created}
            label="Quizzes Created"
            valueColor={colors.primary[300]}
          />
          <StatCard
            icon="🎉"
            value={metrics.fun_level}
            label="Fun Level"
            valueColor={colors.secondary[400]}
          />
        </div>
      </div>
    </section>
  );
}
