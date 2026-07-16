import { useEffect, useRef, useState } from 'react';
import './Reveal.css';

// One reveal engine for the whole site (Hero excluded — it has its own
// animation). Built the same way the three reveals it replaces already
// worked (IntersectionObserver + a toggled `is-visible` class), just
// generalized and fixed to run both ways: the old per-page versions called
// `observer.disconnect()`/`unobserve()` the first time an element appeared,
// so they could only ever animate in once and never reversed. Here,
// visibility is just `entry.isIntersecting` with nothing ever disconnected,
// so the same element naturally animates out on exit and back in on
// re-entry, from either scroll direction, indefinitely.
const PRESET_THRESHOLDS = {
  section: 0.15,
  title: 0.3,
  subtitle: 0.3,
  paragraph: 0.2,
  card: 0.15,
};

export default function Reveal({
  as: Component = 'div',
  preset,
  className = '',
  delay = 0,
  threshold,
  style: styleProp,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const observerThreshold = threshold ?? (preset ? PRESET_THRESHOLDS[preset] : 0.2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: observerThreshold,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerThreshold]);

  // Presets bring their own `reveal`/`reveal--*` classes and built-in CSS.
  // Without a preset, this only adds the is-visible toggle to whatever
  // className the caller already owns — used for the three sections that
  // already had their own hand-authored reveal CSS (About, Experience,
  // Contact), so their exact existing look carries over untouched; only
  // the JS behavior underneath changes.
  const classes = [preset ? 'reveal' : '', preset ? `reveal--${preset}` : '', className, visible ? 'is-visible' : '']
    .filter(Boolean)
    .join(' ');

  const style = delay ? { ...styleProp, transitionDelay: `${delay}s` } : styleProp;

  return (
    <Component ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Component>
  );
}
