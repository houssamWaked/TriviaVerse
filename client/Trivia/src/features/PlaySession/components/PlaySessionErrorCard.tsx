import PlaySessionStyle from '@/Styles/ComponentStyles/PlaySessionStyle';

type PlaySessionErrorCardProps = {
  error: string;
};

export default function PlaySessionErrorCard({ error }: PlaySessionErrorCardProps) {
  if (!error) return null;

  return (
    <div className="tv-card" style={PlaySessionStyle.errorCard}>
      {error}
    </div>
  );
}
