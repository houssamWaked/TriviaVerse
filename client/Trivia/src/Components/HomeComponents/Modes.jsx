import colors from '@/constants/colors';
import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import ModeCard from '@/Cards/HomeCards/ModeCard';
import ModesStyle from '@/Styles/ComponentStyles/ModesStyle';

export default function Modes({ onStory, onMillionaire, onClassic, onBlitz }) {
  return (
    <section style={ModesStyle.section}>
      <div style={ModesStyle.container}>
        <h1 style={ModesStyle.title}>
          {STRINGS.HOME.modes.title}{' '}
          <span style={ModesStyle.titleIcon}>{ICONS.common.gamepad}</span>
        </h1>
        <p style={ModesStyle.subtitle}>{STRINGS.HOME.modes.subtitle}</p>

        <div style={ModesStyle.grid}>
          <ModeCard
            icon={ICONS.common.book}
            title={STRINGS.HOME.modes.storyTitle}
            desc={`${STRINGS.HOME.modes.storyDesc} ${ICONS.common.gamepad}`}
            gradient={colors.gradients.story}
            onClick={onStory || (() => {})}
          />

          <ModeCard
            icon={ICONS.common.rich}
            title={STRINGS.HOME.modes.millionaireTitle}
            desc={`${STRINGS.HOME.modes.millionaireDesc} ${ICONS.common.money}`}
            gradient={colors.gradients.millionaire}
            onClick={onMillionaire || (() => {})}
          />

          <ModeCard
            icon={ICONS.common.mask}
            title={STRINGS.HOME.modes.classicTitle}
            desc={`${STRINGS.HOME.modes.classicDesc} ${ICONS.common.dart}`}
            gradient={colors.gradients.classic}
            onClick={onClassic || (() => {})}
          />

          <ModeCard
            icon={ICONS.common.bolt}
            title={STRINGS.HOME.modes.blitzTitle}
            desc={`${STRINGS.HOME.modes.blitzDesc} ${ICONS.common.bolt}`}
            gradient={colors.gradients.blitz}
            onClick={onBlitz || (() => {})}
          />
        </div>
      </div>
    </section>
  );
}
