import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import '../../styles/StaggeredMenu.css';

export const StaggeredMenu = ({
  position = 'right',
  colors = ['#B19EEF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = '/src/assets/logos/reactbits-gh-white.svg',
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#5227FF',
  changeMenuColorOnOpen = true,
  isFixed = false,
  activeItemId,
  socialsTitle = 'Socials',
  languageSwitcher = null,
  languageAction = null,
  menuButtonText = 'Menu',
  closeButtonText = 'Close',
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const preLayerElsRef = useRef([]);
  const plusHRef = useRef(null);
  const plusVRef = useRef(null);
  const iconRef = useRef(null);
  const textInnerRef = useRef(null);
  const textWrapRef = useRef(null);
  const [textLines, setTextLines] = useState([menuButtonText, closeButtonText]);

  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const spinTweenRef = useRef(null);
  const textCycleAnimRef = useRef(null);
  const colorTweenRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const busyRef = useRef(false);
  const itemEntranceTweenRef = useRef(null);
  // Debounces repeated nav-item clicks against an in-flight
  // scrollIntoView so a rapid double-click can't stack two scroll
  // animations. Always cleared by a timeout too (not just 'scrollend'),
  // since scrollIntoView produces no scroll — and so no 'scrollend' —
  // when the target is already in view.
  const scrollingRef = useRef(false);
  const prevOpenRef = useRef(false);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll('.sm-prelayer'));
      }
      preLayerElsRef.current = preLayers;

      // This effect also re-runs whenever `position` flips — which happens
      // on every language switch, since Arabic docks the panel on the
      // opposite side. If the menu is open at that moment, forcing panel/
      // preLayers/icon/label back to their closed resting state here would
      // yank the visibly-open panel off-screen and revert the icon to a
      // hamburger, even though nothing was actually closed. Only establish
      // the closed state while the menu is genuinely closed (including on
      // first mount).
      if (openRef.current) return;

      const offscreen = position === 'left' ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen });
      gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
      gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
      gsap.set(textInner, { yPercent: 0 });
      if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const layerStates = layers.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    // .sm-socials-link declares `transition: opacity .3s` for its hover-dim
    // interaction — but that same unconditional CSS transition also fires on
    // every inline-style opacity change GSAP makes here, so the browser's own
    // transition was fighting GSAP's tween for control of the same property
    // every frame. Suspending it for the duration of the entrance (and
    // restoring it via clearProps once the tween finishes, alongside the
    // existing opacity clearProps) gives GSAP uncontested ownership while it
    // owns the animation, without touching the hover-dim transition itself.
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0, transition: 'none' });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            // Subtle by design — the labels stay the primary focus, the
            // numbers are just a quiet index, not a competing element.
            '--sm-num-opacity': 0.25,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity,transition' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(
    onDone => {
      openTlRef.current?.kill();
      openTlRef.current = null;
      itemEntranceTweenRef.current?.kill();

      const panel = panelRef.current;
      const layers = preLayerElsRef.current;
      if (!panel) return;

      const all = [...layers, panel];
      closeTweenRef.current?.kill();
      const offscreen = position === 'left' ? -100 : 100;
      closeTweenRef.current = gsap.to(all, {
        xPercent: offscreen,
        duration: 0.32,
        ease: 'power3.in',
        overwrite: 'auto',
        onComplete: () => {
          const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
          if (itemEls.length) {
            gsap.set(itemEls, { yPercent: 140, rotate: 10 });
          }
          const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
          if (numberEls.length) {
            gsap.set(numberEls, { '--sm-num-opacity': 0 });
          }
          const socialTitle = panel.querySelector('.sm-socials-title');
          const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
          if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
          if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
          busyRef.current = false;
          // Page scroll stays locked for the full close animation, not
          // just until React's `open` state flips — only unlocked once
          // the panel has actually finished animating away.
          document.body.style.overflow = '';
          // Runs only once the panel is actually gone and scroll is
          // unlocked again — e.g. a nav click's navigate() call, so the
          // smooth-scroll never races the close animation or fires while
          // body scroll is still locked.
          onDone?.();
        }
      });
    },
    [position]
  );

  const animateIcon = useCallback(opening => {
    const icon = iconRef.current;
    if (!icon) return;
    spinTweenRef.current?.kill();
    if (opening) {
      spinTweenRef.current = gsap.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      spinTweenRef.current = gsap.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }, []);

  const animateColor = useCallback(
    opening => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(btn, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.set(btn, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  React.useEffect(() => {
    if (toggleBtnRef.current) {
      if (changeMenuColorOnOpen) {
        const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
        gsap.set(toggleBtnRef.current, { color: targetColor });
      } else {
        gsap.set(toggleBtnRef.current, { color: menuButtonColor });
      }
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  // Keeps the toggle's idle label in sync when menuButtonText/closeButtonText
  // change (e.g. a language switch) — only while closed, so an in-progress
  // open/close cycle animation is never interrupted mid-flight.
  React.useEffect(() => {
    if (!openRef.current) {
      setTextLines([menuButtonText, closeButtonText]);
      if (textInnerRef.current) gsap.set(textInnerRef.current, { yPercent: 0 });
    }
  }, [menuButtonText, closeButtonText]);

  const animateText = useCallback(
    opening => {
      const inner = textInnerRef.current;
      if (!inner) return;
      textCycleAnimRef.current?.kill();

      const currentLabel = opening ? menuButtonText : closeButtonText;
      const targetLabel = opening ? closeButtonText : menuButtonText;
      const cycles = 3;
      const seq = [currentLabel];
      let last = currentLabel;
      for (let i = 0; i < cycles; i++) {
        last = last === menuButtonText ? closeButtonText : menuButtonText;
        seq.push(last);
      }
      if (last !== targetLabel) seq.push(targetLabel);
      seq.push(targetLabel);
      setTextLines(seq);

      gsap.set(inner, { yPercent: 0 });
      const lineCount = seq.length;
      const finalShift = ((lineCount - 1) / lineCount) * 100;
      textCycleAnimRef.current = gsap.to(inner, {
        yPercent: -finalShift,
        duration: 0.5 + lineCount * 0.07,
        ease: 'power4.out'
      });
    },
    [menuButtonText, closeButtonText]
  );

  const openMenu = useCallback(() => {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    onMenuOpen?.();
    playOpen();
    animateIcon(true);
    animateColor(true);
    animateText(true);
  }, [playOpen, animateIcon, animateColor, animateText, onMenuOpen]);

  // The single close path — the Close button, a nav-item click, Escape,
  // and clicking outside all funnel through this one function, so every
  // way of closing plays the exact same GSAP animation. `onDone`, when
  // given, fires after that animation (and the scroll-lock release)
  // actually completes — used by nav-item clicks to defer the scroll.
  const closeMenu = useCallback(
    onDone => {
      if (!openRef.current) return;
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose(onDone);
      animateIcon(false);
      animateColor(false);
      animateText(false);
    },
    [playClose, animateIcon, animateColor, animateText, onMenuClose]
  );

  const toggleMenu = useCallback(() => {
    if (openRef.current) closeMenu();
    else openMenu();
  }, [openMenu, closeMenu]);

  // Sequenced on purpose: close the menu first (same animation as the
  // Close button), and only navigate — which is what triggers Homepage's
  // smooth-scroll effect — once that animation (and the scroll-lock
  // release) has actually finished. Navigating immediately, in parallel
  // with the close tween, used to race the scroll-lock: scrollIntoView
  // could fire while body scroll was still locked and silently no-op.
  // Also guards against stacking from rapid repeat clicks — cleared by
  // 'scrollend' OR a timeout fallback, since scrollIntoView never fires
  // 'scrollend' when nothing moves (e.g. clicking the section you're
  // already at).
  const handleNavItemClick = useCallback(
    (e, link) => {
      e.preventDefault();
      if (scrollingRef.current) return;
      scrollingRef.current = true;

      closeMenu(() => {
        navigate(link);

        let settled = false;
        const fallback = setTimeout(() => {
          if (settled) return;
          settled = true;
          scrollingRef.current = false;
          window.removeEventListener('scrollend', onScrollEnd);
        }, 1000);
        function onScrollEnd() {
          if (settled) return;
          settled = true;
          scrollingRef.current = false;
          clearTimeout(fallback);
        }
        window.addEventListener('scrollend', onScrollEnd, { once: true });
      });
    },
    [closeMenu, navigate]
  );

  // Escape closes the menu, only while it's open.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeMenu]);

  // Clicking outside the panel (and outside the toggle button, which
  // already has its own click handler) closes the menu.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = e => {
      const panel = panelRef.current;
      const toggle = toggleBtnRef.current;
      if (panel?.contains(e.target) || toggle?.contains(e.target)) return;
      closeMenu();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, closeMenu]);

  // Locks page scroll for as long as the panel is visually present.
  // Unlocking happens in playClose's onComplete instead of here, so
  // scroll stays locked through the entire close animation, not just
  // until `open` flips to false. scrollbar-gutter:stable on <html>
  // (set globally) means toggling overflow never shifts layout.
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Focus the first nav item on open (after the aria-hidden removal
  // from this same render has committed); return focus to the toggle
  // button on a genuine open->close transition (not on initial mount).
  // preventScroll is essential here: at the moment this runs, the panel
  // is still mid-slide-in (transformed off-screen by GSAP), so a normal
  // .focus() call makes the browser try to scroll the page to reveal an
  // element it thinks is off-viewport — fighting the GSAP tween and
  // making the whole entrance look broken/jumpy.
  useEffect(() => {
    if (open) {
      prevOpenRef.current = true;
      panelRef.current?.querySelector('.sm-panel-item')?.focus({ preventScroll: true });
    } else if (prevOpenRef.current) {
      prevOpenRef.current = false;
      toggleBtnRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  return (
    <div
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={accentColor ? { ['--sm-accent']: accentColor } : undefined}
      data-position={position}
      data-open={open || undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {(() => {
          const raw = colors && colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c'];
          let arr = [...raw];
          if (arr.length >= 3) {
            const mid = Math.floor(arr.length / 2);
            arr.splice(mid, 1);
          }
          return arr.map((c, i) => <div key={i} className="sm-prelayer" style={{ background: c }} />);
        })()}
      </div>
      <header className="staggered-menu-header" aria-label="Main navigation header">
        {/* Opposite end from the toggle via the header's own
            justify-content:space-between — pure logical flex row, no
            hardcoded left/right, mirrors automatically under RTL. */}
        <div className="sm-header-start">{languageSwitcher}</div>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span ref={textWrapRef} className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((l, i) => (
                <span className="sm-toggle-line" key={i}>
                  {l}
                </span>
              ))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={plusHRef} className="sm-icon-line" />
            <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside id="staggered-menu-panel" ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
            {items && items.length ? (
              items.map((it, idx) => {
                const isActive = Boolean(activeItemId) && it.id === activeItemId;
                return (
                  <li className="sm-panel-itemWrap" key={it.id || it.label + idx}>
                    <a
                      className="sm-panel-item"
                      href={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                      data-active={isActive || undefined}
                      onClick={e => handleNavItemClick(e, it.link)}
                    >
                      <span className="sm-panel-itemLabel">{it.label}</span>
                    </a>
                  </li>
                );
              })
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>
          {displaySocials && ((socialItems && socialItems.length > 0) || languageAction) && (
            <div className="sm-socials" aria-label={socialsTitle}>
              <h3 className="sm-socials-title">{socialsTitle}</h3>
              <div className="sm-socials-row">
                <ul className="sm-socials-list" role="list">
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a href={s.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
                {/* A utility, not a navigation destination — sits
                    opposite the social links, not underneath them. */}
                {languageAction && (
                  <button
                    type="button"
                    className="sm-socials-link sm-socials-lang"
                    dir="ltr"
                    onClick={languageAction.onClick}
                    aria-label={languageAction.ariaLabel}
                  >
                    <span className="sm-socials-lang-tag">{languageAction.tag}</span>
                    <span className="sm-socials-lang-row">
                      <span className="sm-socials-lang-arrow">↳</span>
                      <span
                        className={
                          'sm-socials-lang-value' + (languageAction.isTargetArabic ? ' sm-socials-lang-value--ar' : '')
                        }
                      >
                        {languageAction.name}
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default StaggeredMenu;