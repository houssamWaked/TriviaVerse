import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import FeatureCard from '@/Cards/HomeCards/FeatureCard';
import FeatureCardStyle from '@/Styles/ComponentStyles/FeaturesStripStyle';

export default function FeaturesStrip() {
  return (
    <section style={FeatureCardStyle.section}>
      <div style={FeatureCardStyle.container}>
        <FeatureCard
          icon={ICONS.common.bolt}
          title={STRINGS.HOME.features.lightningTitle}
          desc={STRINGS.HOME.features.lightningDesc}
          accent={colors.accent.yellow}
        />
        <FeatureCard
          icon={ICONS.common.trophy}
          title={STRINGS.HOME.features.rewardsTitle}
          desc={STRINGS.HOME.features.rewardsDesc}
          accent={colors.accent.orange}
        />
        <FeatureCard
          icon={ICONS.common.people}
          title={STRINGS.HOME.features.togetherTitle}
          desc={STRINGS.HOME.features.togetherDesc}
          accent={colors.neutral[800]}
        />
      </div>
    </section>
  );
}

