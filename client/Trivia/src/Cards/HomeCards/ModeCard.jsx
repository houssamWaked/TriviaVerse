import ModeCardStyle from '../../Styles/CardStyles/ModeCardStyle';
function ModeCard({ icon, title, desc, gradient, onClick }) {
  return (
    <div
      className="tv-card tv-card--hover tv-mode-card"
      style={{ ...ModeCardStyle.card, background: gradient }}
    >
      <div className="tv-mode-icon" style={ModeCardStyle.cardIcon}>
        {icon}
      </div>

      <div style={ModeCardStyle.cardTitle}>{title}</div>
      <div style={ModeCardStyle.cardDesc}>{desc}</div>

      <button type="button" style={ModeCardStyle.cardBtn} onClick={onClick}>
        <span style={ModeCardStyle.playIcon}>▶</span>
        Play Now!
      </button>
    </div>
  );
}

export default ModeCard;
