import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import useInViewport from '../../hooks/useInViewport';
import { registerSharedFrame } from '../../hooks/useSharedRAF';
import './LogoLoop.css';

const ANIMATION_CONFIG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 };

const toCssLength = value => (typeof value === 'number' ? `${value}px` : (value ?? undefined));

const useResizeObserver = (callback, elements, dependencies) => {
  useEffect(() => {
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback();
      return () => window.removeEventListener('resize', handleResize);
    }
    const observers = elements.map(ref => {
      if (!ref.current) return null;
      const observer = new ResizeObserver(callback);
      observer.observe(ref.current);
      return observer;
    });
    callback();
    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [callback, elements, dependencies]);
};

const useImageLoader = (seqRef, onLoad, dependencies) => {
  useEffect(() => {
    const images = seqRef.current?.querySelectorAll('img') ?? [];
    if (images.length === 0) {
      onLoad();
      return;
    }
    let remainingImages = images.length;
    const handleImageLoad = () => {
      remainingImages -= 1;
      if (remainingImages === 0) onLoad();
    };
    images.forEach(img => {
      const htmlImg = img;
      if (htmlImg.complete) {
        handleImageLoad();
      } else {
        htmlImg.addEventListener('load', handleImageLoad, { once: true });
        htmlImg.addEventListener('error', handleImageLoad, { once: true });
      }
    });
    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [onLoad, seqRef, dependencies]);
};

const useAnimationLoop = (trackRef, targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, isRtl, inView) => {
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    // Skipping the effect entirely while out of view — rather than
    // scheduling a frame just to check a flag and bail — is what actually
    // stops the work instead of merely hiding its output. The effect
    // re-runs the moment `inView` flips back to true. Registration is
    // with the ONE page-wide RAF loop (useSharedRAF), not a per-instance
    // requestAnimationFrame: Skills mounts six of these marquees, so this
    // is six loops folded into one shared tick that also stops itself
    // entirely when the tab is backgrounded.
    if (!track || !inView) return;

    const seqSize = isVertical ? seqHeight : seqWidth;

    // .logoloop__track is a normal block-flow child of .logoloop, not a
    // flex item itself — so under RTL its own inline-start (i.e. physical
    // right) edge anchors to the container instead of the left, and the
    // much-wider track (sized to fit every duplicated copy) extends
    // *leftward* from there instead of rightward. The pre-rendered buffer
    // that keeps the marquee seamless therefore sits on the opposite
    // physical side from LTR. A translateX that always moves the track in
    // the same physical direction (however offset is accumulating) eats
    // through whichever side has no buffer and shows a gap before the
    // next copy scrolls in — so the sign has to flip with the anchor.
    const horizontalSign = isRtl ? 1 : -1;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      const transformValue = isVertical
        ? `translate3d(0, ${-offsetRef.current}px, 0)`
        : `translate3d(${horizontalSign * offsetRef.current}px, 0, 0)`;
      track.style.transform = transformValue;
    }

    const animate = (_now, deltaMs) => {
      // Shared loop hands us the ms since the previous frame directly.
      // Clamp so a long idle gap (loop was stopped, tab was hidden, this
      // callback just registered) can't produce one huge jump.
      const deltaTime = Math.min(Math.max(0, deltaMs) / 1000, 0.05);

      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;

      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqSize > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
        offsetRef.current = nextOffset;

        const transformValue = isVertical
          ? `translate3d(0, ${-offsetRef.current}px, 0)`
          : `translate3d(${horizontalSign * offsetRef.current}px, 0, 0)`;
        track.style.transform = transformValue;
      }
    };

    return registerSharedFrame(animate);
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef, isRtl, inView]);
};

export const LogoLoop = memo(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    renderItem,
    ariaLabel = 'Partner logos',
    className,
    style
  }) => {
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const seqRef = useRef(null);

    const [seqWidth, setSeqWidth] = useState(0);
    const [seqHeight, setSeqHeight] = useState(0);
    const [copyCount, setCopyCount] = useState(ANIMATION_CONFIG.MIN_COPIES);
    const [isHovered, setIsHovered] = useState(false);
    // Seeded synchronously from the document so the very first paint is
    // already correct (no one-frame flash in the wrong order) — see the
    // effect below for why this needs to be tracked at all.
    const [isRtl, setIsRtl] = useState(
      () => typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
    );
    // Skills renders 6 of these concurrently — each with its own always-on
    // RAF loop before this — so gating per-instance visibility is a real
    // multiplier, not a micro-optimization.
    const inView = useInViewport(containerRef, { rootMargin: '150px 0px' });

    const effectiveHoverSpeed = useMemo(() => {
      if (hoverSpeed !== undefined) return hoverSpeed;
      if (pauseOnHover === true) return 0;
      if (pauseOnHover === false) return undefined;
      return 0;
    }, [hoverSpeed, pauseOnHover]);

    const isVertical = direction === 'up' || direction === 'down';

    const targetVelocity = useMemo(() => {
      const magnitude = Math.abs(speed);
      let directionMultiplier;
      if (isVertical) {
        directionMultiplier = direction === 'up' ? 1 : -1;
      } else {
        directionMultiplier = direction === 'left' ? 1 : -1;
      }
      const speedMultiplier = speed < 0 ? -1 : 1;
      return magnitude * directionMultiplier * speedMultiplier;
    }, [speed, direction, isVertical]);

    const updateDimensions = useCallback(() => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const sequenceRect = seqRef.current?.getBoundingClientRect?.();
      const sequenceWidth = sequenceRect?.width ?? 0;
      const sequenceHeight = sequenceRect?.height ?? 0;
      if (isVertical) {
        const parentHeight = containerRef.current?.parentElement?.clientHeight ?? 0;
        if (containerRef.current && parentHeight > 0) {
          const targetHeight = Math.ceil(parentHeight);
          if (containerRef.current.style.height !== `${targetHeight}px`)
            containerRef.current.style.height = `${targetHeight}px`;
        }
        if (sequenceHeight > 0) {
          setSeqHeight(Math.ceil(sequenceHeight));
          const viewport = containerRef.current?.clientHeight ?? parentHeight ?? sequenceHeight;
          const copiesNeeded = Math.ceil(viewport / sequenceHeight) + ANIMATION_CONFIG.COPY_HEADROOM;
          setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
        }
      } else if (sequenceWidth > 0) {
        setSeqWidth(Math.ceil(sequenceWidth));
        const copiesNeeded = Math.ceil(containerWidth / sequenceWidth) + ANIMATION_CONFIG.COPY_HEADROOM;
        setCopyCount(Math.max(ANIMATION_CONFIG.MIN_COPIES, copiesNeeded));
      }
    }, [isVertical]);

    // Tracked here (not just inside useAnimationLoop) because it also
    // needs to be read on every render for the transform-sign fix — see
    // that hook for why RTL needs different animation math. Watched via
    // MutationObserver, not read just once, so toggling the language
    // while the page is open re-derives this immediately.
    useEffect(() => {
      if (isVertical) return undefined;
      const track = trackRef.current;

      const update = () => {
        const nextIsRtl = track
          ? getComputedStyle(track).direction === 'rtl'
          : document.documentElement.dir === 'rtl';
        setIsRtl(nextIsRtl);
      };
      update();

      const observer = new MutationObserver(update);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
      return () => observer.disconnect();
    }, [isVertical]);

    // Memoized so the two hooks below don't tear down and rebuild their
    // ResizeObserver / image listeners on every single render (their
    // effects key on these array identities).
    const observeTargets = useMemo(() => [containerRef, seqRef], []);
    const measureDeps = useMemo(
      () => [logos, gap, logoHeight, isVertical],
      [logos, gap, logoHeight, isVertical]
    );

    useResizeObserver(updateDimensions, observeTargets, measureDeps);

    useImageLoader(seqRef, updateDimensions, measureDeps);

    useAnimationLoop(trackRef, targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical, isRtl, inView);

    const cssVariables = useMemo(
      () => ({
        '--logoloop-gap': `${gap}px`,
        '--logoloop-logoHeight': `${logoHeight}px`,
        ...(fadeOutColor && { '--logoloop-fadeColor': fadeOutColor })
      }),
      [gap, logoHeight, fadeOutColor]
    );

    const rootClassName = useMemo(
      () =>
        [
          'logoloop',
          isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
          fadeOut && 'logoloop--fade',
          scaleOnHover && 'logoloop--scale-hover',
          className
        ]
          .filter(Boolean)
          .join(' '),
      [isVertical, fadeOut, scaleOnHover, className]
    );

    const handleMouseEnter = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(true);
    }, [effectiveHoverSpeed]);
    const handleMouseLeave = useCallback(() => {
      if (effectiveHoverSpeed !== undefined) setIsHovered(false);
    }, [effectiveHoverSpeed]);

    const renderLogoItem = useCallback(
      (item, key) => {
        if (renderItem) {
          return (
            <li className="logoloop__item" key={key}>
              {renderItem(item, key)}
            </li>
          );
        }
        const isNodeItem = 'node' in item;
        const content = isNodeItem ? (
          <span className="logoloop__node" aria-hidden={!!item.href && !item.ariaLabel}>
            {item.node}
          </span>
        ) : (
          <img
            src={item.src}
            srcSet={item.srcSet}
            sizes={item.sizes}
            width={item.width}
            height={item.height}
            alt={item.alt ?? ''}
            title={item.title}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        );
        const itemAriaLabel = isNodeItem ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title);
        const itemContent = item.href ? (
          <a
            className="logoloop__link"
            href={item.href}
            aria-label={itemAriaLabel || 'logo link'}
            target="_blank"
            rel="noreferrer noopener"
          >
            {content}
          </a>
        ) : (
          content
        );
        return (
          <li className="logoloop__item" key={key}>
            {itemContent}
          </li>
        );
      },
      [renderItem]
    );

    const logoLists = useMemo(
      () =>
        Array.from({ length: copyCount }, (_, copyIndex) => (
          <ul
            className="logoloop__list"
            key={`copy-${copyIndex}`}
            aria-hidden={copyIndex > 0}
            ref={copyIndex === 0 ? seqRef : undefined}
          >
            {logos.map((item, itemIndex) => renderLogoItem(item, `${copyIndex}-${itemIndex}`))}
          </ul>
        )),
      [copyCount, logos, renderLogoItem]
    );

    const containerStyle = useMemo(
      () => ({
        width: isVertical
          ? toCssLength(width) === '100%'
            ? undefined
            : toCssLength(width)
          : (toCssLength(width) ?? '100%'),
        ...cssVariables,
        ...style
      }),
      [width, cssVariables, style, isVertical]
    );

    return (
      <div ref={containerRef} className={rootClassName} style={containerStyle} role="region" aria-label={ariaLabel}>
        <div className="logoloop__track" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {logoLists}
        </div>
      </div>
    );
  }
);

LogoLoop.displayName = 'LogoLoop';

export default LogoLoop;
