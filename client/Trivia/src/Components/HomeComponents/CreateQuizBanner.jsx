import CreateQuizBannerStyle from '../../Styles/ComponentStyles/CreateQuizBannerStyle';
export default function CreateQuizBanner({ onCreate }) {
  return (
    <section style={CreateQuizBannerStyle.section}>
      <div style={CreateQuizBannerStyle.card}>
        {/* Decorative stars */}
        <span style={{ ...CreateQuizBannerStyle.star, top: 18, right: 22 }}>
          ⭐
        </span>
        <span style={{ ...CreateQuizBannerStyle.star, bottom: 20, left: 26 }}>
          ✨
        </span>

        {/* Left content */}
        <div style={CreateQuizBannerStyle.left}>
          <div style={CreateQuizBannerStyle.iconWrap}>🎨</div>

          <div>
            <h2 style={CreateQuizBannerStyle.title}>Create Your Own Quiz!</h2>
            <p style={CreateQuizBannerStyle.subtitle}>
              Make it fun, make it yours, share with the world! ✨
            </p>
          </div>
        </div>

        {/* Right CTA */}
        <button
          type="button"
          style={CreateQuizBannerStyle.button}
          onClick={onCreate}
        >
          Start Creating! 🚀
        </button>
      </div>
    </section>
  );
}
