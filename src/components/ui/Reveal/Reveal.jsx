import useRevealObserver from '../../../hooks/useRevealObserver';
import './Reveal.css';

// One reveal engine for the whole site (Hero excluded — it has its own
// animation). Reversible by default; callers with expensive nested entrance
// sequences can opt into `once` so completed content is not torn down and
// reconstructed every time an adjacent section crosses the viewport.
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
  onVisibleChange,
  once = false,
  children,
  ...rest
}) {
  const observerThreshold = threshold ?? (preset ? PRESET_THRESHOLDS[preset] : 0.2);

  // Reuse origin/main's observer pool for both modes. Reversible reveals
  // stay subscribed indefinitely; `once` reveals remove only their own
  // target from the shared pool after the first intersection.
  const [ref, visible] = useRevealObserver(observerThreshold, onVisibleChange, { once });

  // Presets bring their own `reveal`/`reveal--*` classes and built-in CSS.
  // Without a preset, this only adds the visibility toggle to the caller's
  // hand-authored section animation.
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
