import { Box } from '@mui/material';
import colors from '@/constants/colors';
import CreateQuizBanner from '@/features/Home/components/CreateQuizBanner';
import FeaturesStrip from '@/features/Home/components/FeaturesStrip';
import HomeHero from '@/features/Home/components/HomeHero';
import Modes from '@/features/Home/components/Modes';
import { useHomeMetrics } from '../hooks/useHomeMetrics';

export type HomePageProps = {
  user?: unknown;
  onRequireAuth?: (...args: [string?]) => void;
  onNavigateCreateQuiz?: () => void;
  onNavigateStory?: () => void;
  onNavigateMillionaire?: () => void;
  onNavigateClassic?: () => void;
  onNavigateBlitz?: () => void;
};

function HomePage({
  user,
  onRequireAuth,
  onNavigateCreateQuiz,
  onNavigateStory,
  onNavigateMillionaire,
  onNavigateClassic,
  onNavigateBlitz,
}: HomePageProps) {
  const metrics = useHomeMetrics();

  const handleCreateQuiz = async () => {
    if (!user) return onRequireAuth?.('create-quiz');
    return onNavigateCreateQuiz?.();
  };

  return (
    <Box
      component="main"
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: 'common.white',
        background: `
          radial-gradient(circle at top left, rgba(37,99,235,0.22), rgba(37,99,235,0) 34%),
          linear-gradient(180deg, ${colors.neutral[900]} 0%, ${colors.neutral[800]} 100%)
        `,
      }}
    >
      <HomeHero
        metrics={metrics}
        onCreateQuiz={handleCreateQuiz}
        onStartPlaying={() => {
          const el = document.getElementById('modes');
          el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
        }}
      />
      <Box id="modes" sx={{ position: 'relative', scrollMarginTop: 96 }}>
        <Modes
          onStory={onNavigateStory}
          onMillionaire={onNavigateMillionaire}
          onClassic={onNavigateClassic}
          onBlitz={onNavigateBlitz}
        />
      </Box>
      <CreateQuizBanner onCreate={handleCreateQuiz} />
      <FeaturesStrip />
    </Box>
  );
}

export default HomePage;

