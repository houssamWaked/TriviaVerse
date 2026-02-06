import statCardStyle from '../../Styles/CardStyles/StatCardStyle';
function StatCard({ icon, value, label, valueColor }) {
  return (
    <div className="tv-card tv-card--hover" style={statCardStyle.card}>
      <div style={statCardStyle.cardIcon}>{icon}</div>
      <div style={{ ...statCardStyle.cardValue, color: valueColor }}>
        {value}
      </div>
      <div style={statCardStyle.cardLabel}>{label}</div>
    </div>
  );
}
export default StatCard;
