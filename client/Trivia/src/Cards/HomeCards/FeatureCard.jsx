import FeatureCardStyle from '../../Styles/CardStyles/FeatureCardStyle';
export default function FeatureCard({ icon, title, desc, accent }) {
  return (
    <div className="tv-card tv-card--hover" style={FeatureCardStyle.card}>
      <div style={{ ...FeatureCardStyle.icon, color: accent }}>{icon}</div>
      <h3 style={FeatureCardStyle.title}>{title}</h3>
      <p style={FeatureCardStyle.desc}>{desc}</p>
    </div>
  );
}
