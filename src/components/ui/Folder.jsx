import { useState } from 'react';
import './Folder.css';

const darkenColor = (hex, percent) => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map(c => c + c)
      .join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Each row holds up to this many papers before a new arc starts above it —
// keeps card size constant as the portfolio grows instead of shrinking
// cards to cram more in. Exported so callers can reserve enough clearance
// above the folder for however many rows a given item count will produce.
export const ROW_CAPACITY = 9;
// Sequencing (not a redesign of the existing fan/lid mechanics — just when
// each phase is allowed to start): opening, the lid gets this much of a
// head start before any paper begins moving, so the lid visibly leads and
// the fan reads as "papers sliding out of an already-opening folder"
// rather than everything moving at once. Closing, the same gap is given to
// the papers instead, so they've visibly retreated before the lid swings
// shut over them.
const LID_LEAD_MS = 180;
const PAPER_LEAD_MS = 140;
const BASE_RADIUS = 165;
const RADIUS_STEP = 130; // each row further from the folder gets a wider arc
const MAX_SWEEP_DEG = 62; // half-angle of a 5-or-fewer row, from vertical

// True polar placement: papers sit on a circular arc of a given radius,
// swept symmetrically around straight-up. Values are unitless — the CSS
// multiplies them by %/deg so the fan scales proportionally with the
// folder's own `size`.
const computeFan = (index, total) => {
  if (total <= 1) return { x: 0, y: -BASE_RADIUS, rot: 0, z: 0, delay: 0, tint: 0.9 };

  const rowIndex = Math.floor(index / ROW_CAPACITY);
  const rowStart = rowIndex * ROW_CAPACITY;
  const rowSize = Math.min(ROW_CAPACITY, total - rowStart);
  const indexInRow = index - rowStart;

  const extra = Math.max(0, rowSize - 5);
  const sweepDeg = Math.min(MAX_SWEEP_DEG + extra * 6, 86);
  const radius = BASE_RADIUS + rowIndex * RADIUS_STEP + extra * 16;
  const tint = Math.max(0.78, Math.min(0.98, 0.86 + 0.08 * Math.sin(index * 2.4)));

  if (rowSize <= 1) {
    const z = rowIndex * ROW_CAPACITY;
    return { x: 0, y: -radius, rot: 0, z, delay: rowIndex * 40, tint };
  }

  const center = (rowSize - 1) / 2;
  const d = indexInRow - center;
  const t = d / center; // -1..1, 0 at row's own center
  const angleDeg = t * sweepDeg;
  const angleRad = (angleDeg * Math.PI) / 180;

  const x = radius * Math.sin(angleRad);
  const y = -radius * Math.cos(angleRad);
  const rot = Math.max(-24, Math.min(24, angleDeg * 0.4));
  // Outer rows stack above inner ones; within a row, center papers stack
  // above their neighbors.
  const z = rowIndex * ROW_CAPACITY + Math.round((1 - Math.abs(t)) * (rowSize - 1));
  // Papers cascade outward from each row's center, like sliding out of a
  // real folder rather than all snapping into place at once.
  const delay = rowIndex * 40 + Math.abs(d) * 22;

  return { x, y, rot, z, delay, tint };
};

// Adapted from React Bits' Folder component. Differs from the vendor
// version in a few ways this app's usage needs:
//  - `items` is no longer capped/padded to exactly 3 — any number of
//    papers is laid out via computeFan() instead of hardcoded nth-child
//    CSS rules, so the same component works for 5 (or any N) papers.
//  - Each paper's open-state position/rotation/stacking is passed down
//    as CSS custom properties instead of being baked into the stylesheet.
//  - An optional controlled `open` prop plus an `onToggle(nextOpen)`
//    callback let a parent own the open/closed state while the folder's
//    own div remains the actual click/keyboard target — this matters
//    because the papers themselves are real interactive elements (each
//    one opens a modal), so the folder can't be wrapped in a `<button>`
//    without creating invalid nested buttons.
//  - `.folder__back` is inert while closed, so hidden papers can never
//    be tabbed to or clicked.
const Folder = ({
  color = '#5227FF',
  size = 1,
  items = [],
  className = '',
  open: controlledOpen,
  onToggle,
  interactive = true,
}) => {
  const papers = items;

  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [paperOffsets, setPaperOffsets] = useState({});

  const folderBackColor = darkenColor(color, 0.08);

  const handleClick = () => {
    if (!interactive) return;
    const next = !open;
    onToggle?.(next);
    if (!isControlled) setUncontrolledOpen(next);
    if (!next) setPaperOffsets({});
  };

  const handlePaperMouseMove = (e, index) => {
    if (!open || !interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets(prev => ({ ...prev, [index]: { x: offsetX, y: offsetY } }));
  };

  const handlePaperMouseLeave = (_e, index) => {
    setPaperOffsets(prev => ({ ...prev, [index]: { x: 0, y: 0 } }));
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
    '--lid-delay': open ? '0ms' : `${PAPER_LEAD_MS}ms`,
  };

  const folderClassName = `folder ${open ? 'open' : ''}`.trim();
  const scaleStyle = { transform: `scale(${size})` };

  const interactiveProps = interactive
    ? {
        onClick: handleClick,
        onKeyDown: e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        },
        tabIndex: 0,
        role: 'button',
        'aria-expanded': open,
        'aria-label': open ? 'Close folder' : 'Open folder',
      }
    : { 'aria-hidden': true };

  return (
    <div style={scaleStyle} className={className}>
      <div className={folderClassName} style={folderStyle} {...interactiveProps}>
        <div className="folder__back" inert={!open}>
          {papers.map((item, i) => {
            const fan = computeFan(i, papers.length);
            const offset = paperOffsets[i] || { x: 0, y: 0 };
            return (
              <div
                key={i}
                className={`paper paper-${i + 1}`}
                onMouseMove={e => handlePaperMouseMove(e, i)}
                onMouseLeave={e => handlePaperMouseLeave(e, i)}
                style={{
                  '--fan-x': fan.x,
                  '--fan-y': fan.y,
                  '--fan-rot': fan.rot,
                  '--fan-z': fan.z,
                  // The lead-in only matters on the way open — closing
                  // already zeroes this out via the `:not(.open) .paper`
                  // rule in Folder.css, which wins regardless of this value.
                  '--fan-delay': `${LID_LEAD_MS + fan.delay}ms`,
                  '--paper-tint': fan.tint,
                  '--magnet-x': `${offset.x}px`,
                  '--magnet-y': `${offset.y}px`,
                }}
              >
                {item}
              </div>
            );
          })}
          <div className="folder__front"></div>
          <div className="folder__front right"></div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
