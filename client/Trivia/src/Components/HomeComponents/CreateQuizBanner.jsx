import { ICONS } from '@/constants/icons';
import { STRINGS } from '@/constants/strings';
import CreateQuizBannerStyle from '@/Styles/ComponentStyles/CreateQuizBannerStyle';

export default function CreateQuizBanner({ onCreate }) {
  return (
    <section style={CreateQuizBannerStyle.section}>
      <div style={CreateQuizBannerStyle.card}>
        <span style={CreateQuizBannerStyle.starTopRight}>
          {ICONS.common.star}
        </span>
        <span style={CreateQuizBannerStyle.starBottomLeft}>
          {ICONS.brand.sparkles}
        </span>

        <div style={CreateQuizBannerStyle.left}>
          <div style={CreateQuizBannerStyle.iconWrap}>{ICONS.common.palette}</div>

          <div>
            <h2 style={CreateQuizBannerStyle.title}>{STRINGS.HOME.banner.title}</h2>
            <p style={CreateQuizBannerStyle.subtitle}>
              {STRINGS.HOME.banner.subtitle} {ICONS.brand.sparkles}
            </p>
          </div>
        </div>

        <button
          type="button"
          style={CreateQuizBannerStyle.button}
          onClick={onCreate}
        >
          {STRINGS.HOME.banner.cta} {ICONS.common.rocket}
        </button>
      </div>
    </section>
  );
}
