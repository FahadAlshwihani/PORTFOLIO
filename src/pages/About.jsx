import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const paragraphs = t('profile.paragraphs', { returnObjects: true });
  const specializationItems = t('profile.specialization.items', { returnObjects: true });
  const techStackItems = t('profile.techStack.items', { returnObjects: true });
  const focusItems = t('profile.focus.items', { returnObjects: true });

  return (
    <section className={`profile-section${isVisible ? ' is-visible' : ''}`} ref={sectionRef}>
      <div className="profile-inner">
        <div className="profile-editorial">
          <p className="profile-eyebrow">{t('profile.eyebrow')}</p>
          <p className="profile-lede">{t('profile.lede')}</p>
          {paragraphs.map((segments, i) => (
            <p className="profile-paragraph" key={i}>
              {segments.map((seg, j) => (
                <span key={j} className={seg.h ? 'profile-highlight' : undefined}>
                  {seg.t}
                </span>
              ))}
            </p>
          ))}
        </div>

        <div className="profile-meta">
          <div className="profile-meta-row">
            <span className="profile-meta-label">{t('profile.role.label')}</span>
            <span className="profile-meta-value">{t('profile.role.value')}</span>
          </div>

          <div className="profile-meta-row">
            <span className="profile-meta-label">{t('profile.specialization.label')}</span>
            <ul className="profile-meta-list">
              {specializationItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="profile-meta-row">
            <span className="profile-meta-label">{t('profile.techStack.label')}</span>
            <ul className="profile-meta-list">
              {techStackItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="profile-meta-row">
            <span className="profile-meta-label">{t('profile.location.label')}</span>
            <span className="profile-meta-value">{t('profile.location.value')}</span>
          </div>

          <div className="profile-meta-row">
            <span className="profile-meta-label">{t('profile.focus.label')}</span>
            <ul className="profile-meta-list">
              {focusItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Profile;
