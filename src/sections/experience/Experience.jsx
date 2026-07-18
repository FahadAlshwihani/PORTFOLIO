import { useTranslation } from 'react-i18next';
import Reveal from '../../components/ui/Reveal/Reveal';
import FlintLogo from '../../assets/images/experience/Flint.png';
import EmaraLogo from '../../assets/images/experience/Emara.png';
import GloriaLogo from '../../assets/images/experience/GloriaJeans.png';
import './Experience.css';

// Splits on sentence boundaries so the description reads as short, scannable
// lines instead of one dense paragraph — without touching the translations.
const splitSentences = (text) => text.split(/(?<=[.!?])\s+/).filter(Boolean);

const CURRENT_PATTERN = /present|حتى الآن/i;

// Real company logos, mapped by experience order (index in experience.items):
// 0 = Azem / current position, worked through Flint Middle East
// 1 = Emara Hail internship
// 2 = Gloria Jean's
const LOGOS = [FlintLogo, EmaraLogo, GloriaLogo];

const Experience = () => {
  const { t } = useTranslation();
  const items = t('experience.items', { returnObjects: true });

  return (
    <section className="experience-section">
      <div className="experience-inner">
        {/* Same reasoning as About.jsx's eyebrow: pure class selector, so
            <p> -> <h2> is semantic-only, and it's what makes the existing
            .experience-company <h3> elements below correctly nested
            instead of skipping straight from H1 to H3. */}
        <h2 className="experience-eyebrow">{t('experience.eyebrow')}</h2>

        <div className="experience-timeline">
          {items.map((item, i) => {
            const year = item.date.match(/\d{4}/)?.[0] || '';
            const isCurrent = CURRENT_PATTERN.test(item.date);
            const sentences = splitSentences(item.description);
            const isAlt = i % 2 === 1;
            const logo = LOGOS[i];

            return (
              <Reveal
                as="article"
                className={['experience-chapter', isAlt && 'experience-chapter--alt'].filter(Boolean).join(' ')}
                key={i}
                threshold={0.2}
              >
                <div className="experience-line-segment" />

                <div className="experience-row">
                  {/* One shared anchor: the dot and its date always belong to
                      the same wrapper, so they can never drift apart. */}
                  <div className="experience-marker">
                    <span className={`experience-dot${isCurrent ? ' experience-dot--current' : ''}`} />
                    <div className="experience-date-block">
                      <span className="experience-year">{year}</span>
                      <span className="experience-range">{item.date}</span>
                    </div>
                  </div>

                  <img
                    className={`experience-watermark${i === 1 ? ' experience-watermark--emara' : ''}`}
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                  />

                  <div className="experience-content">
                    <img className="experience-logo" src={logo} alt={item.logoAlt} loading="lazy" />
                    <h3 className="experience-company">
                      <span className="experience-company-mark">{item.company}</span>
                    </h3>
                    <p className="experience-role">{item.roles.join(' / ')}</p>

                    <div className="experience-description">
                      {sentences.map((sentence, k) => (
                        <span className="experience-description-line" key={k}>{sentence}</span>
                      ))}
                    </div>
                    <div className="experience-tech">
                      {item.technologies.map((tech, k) => (
                        <span className="experience-chip" key={k}>{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Experience;
