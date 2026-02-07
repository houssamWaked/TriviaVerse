import colors from '../../constants/colors'; // adjust path if needed
import ModesStyle from '../../Styles/ComponentStyles/ModesStyle';
import ModeCard from '../../Cards/HomeCards/ModeCard';
export default function Modes({ onStory, onMillionaire, onClassic, onBlitz }) {
  return (
    <section style={ModesStyle.section}>
      <div style={ModesStyle.container}>
        {/* Heading */}
        <h1 style={ModesStyle.title}>
          Choose Your Game! <span style={ModesStyle.titleIcon}>🎮</span>
        </h1>
        <p style={ModesStyle.subtitle}>Pick a mode and let's get started!</p>

        {/* Cards */}
        <div style={ModesStyle.grid}>
          <ModeCard
            icon="📚"
            title="Story Mode"
            desc="Level up through epic challenges! 🎮"
            gradient={colors.gradients.story}
            onClick={onStory || (() => {})}
          />

          <ModeCard
            icon="👑"
            title="Millionaire"
            desc="Win big with lifelines! 💰"
            gradient={colors.gradients.millionaire}
            onClick={onMillionaire || (() => {})}
          />

          <ModeCard
            icon="🎪"
            title="Classic Quiz"
            desc="Pick your category! 🎯"
            gradient={colors.gradients.classic}
            onClick={onClassic || (() => {})}
          />

          <ModeCard
            icon="⚡"
            title="60s Blitz"
            desc="Speed is everything! ⚡"
            gradient={colors.gradients.blitz}
            onClick={onBlitz || (() => {})}
          />
        </div>
      </div>
    </section>
  );
}
