import colors from '../../constants/colors';
import FeatureCardStyle from '../../Styles/ComponentStyles/FeaturesStripStyle';
import FeatureCard from '../../Cards/HomeCards/FeatureCard';
export default function FeaturesStrip() {
  return (
    <section style={FeatureCardStyle.section}>
      <div style={FeatureCardStyle.container}>
        <FeatureCard
          icon="⚡"
          title="Lightning Fast"
          desc="Quick rounds, instant fun!"
          accent={colors.accent.yellow}
        />
        <FeatureCard
          icon="🏆"
          title="Win Rewards"
          desc="Earn badges & trophies!"
          accent={colors.accent.orange}
        />
        <FeatureCard
          icon="👥"
          title="Play Together"
          desc="Challenge your friends!"
          accent={colors.neutral[800]}
        />
      </div>
    </section>
  );
}
