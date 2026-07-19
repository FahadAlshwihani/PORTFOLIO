import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useInViewport from '../../hooks/useInViewport';
import './Terminal.css';

// The prompt on fahad's own machine, before the SSH connection exists —
// deliberately bare (no "fahad@portfolio:~$"), since that prompt only makes
// sense once we're actually inside the remote session.
const LOCAL_PROMPT = '$';
const PROMPT_TEXT = 'fahad@portfolio:~$';
const SSH_CMD = 'ssh fahad@portfolio.dev';
const WHOAMI_CMD = 'whoami';

// Connection status chrome — unlike the prompt and the commands, these are
// user-facing status messages (what's happening right now), not shell
// syntax, so they come from i18next (hero.terminal.*) and translate like
// any other output. Plays once, then stays on screen permanently as the
// session header — it never disappears or replays. Built from `t` inside
// the component (see connectionLines below), not as a module constant, so
// it re-renders in the new language immediately on switch.
const CONNECTION_LINE_KEYS = [
  { key: 'connecting', c: 'text' },
  { key: 'authenticating', c: 'text' },
  { key: 'authSuccess', c: 'check', prefix: '✔ ' },
  { key: 'establishing', c: 'text' },
  { key: 'connected', c: 'check', prefix: '✔ ' },
];

// 5x7 block-letter glyphs for the whoami banner. ASCII banner art is
// inherently a Latin-monospace convention — figlet/toilet have no Arabic
// support, since Arabic's cursive letter-joining can't be represented on a
// fixed character grid. A real whoami would print this same banner
// regardless of locale too (Linux usernames are conventionally ASCII), so
// this is the one piece of terminal content that intentionally never
// localizes — every command around it still does.
const GLYPHS = {
  F: ['█████', '█    ', '█    ', '████ ', '█    ', '█    ', '█    '],
  A: [' ███ ', '█   █', '█   █', '█████', '█   █', '█   █', '█   █'],
  H: ['█   █', '█   █', '█   █', '█████', '█   █', '█   █', '█   █'],
  D: ['████ ', '█   █', '█   █', '█   █', '█   █', '█   █', '████ '],
};

function buildBanner(word) {
  const rows = Array.from({ length: 7 }, () => '');
  Array.from(word).forEach((letter, i) => {
    const glyph = GLYPHS[letter];
    for (let r = 0; r < 7; r++) {
      rows[r] += (i > 0 ? ' ' : '') + glyph[r];
    }
  });
  return rows.join('\n');
}

const NAME_BANNER = buildBanner('FAHAD');

// Display names come from i18next (hero.terminal.featuredProjects.*) so
// they localize like any other project title — this is just the stable
// order/key list, not the displayed text itself.
const FEATURED_PROJECT_KEYS = ['aarc', 'shahm', 'tripsplit', 'kneeguide'];

// ms per character/line at each stage of the sequence.
const SSH_RATE = 22;
const LINE_RATE = 150;
const CMD_RATE = 55;
const DELETE_RATE = 14;
// Output types in at the same rate it erases (DELETE_RATE) rather than the
// command's slower CMD_RATE — a command is paced like a human typing at the
// prompt, but its output is the machine printing back, which is faster and
// (crucially) has to stay symmetric with how it already erases: the same
// engine, same speed, both directions.
const OUTPUT_TYPE_RATE = DELETE_RATE;
const PRE_OUTPUT_DELAY = 400;
const PRE_BANNER_DELAY = 350;
const OUTPUT_HOLD = 1400;
const BANNER_HOLD = 1900;
const NEXT_COMMAND_DELAY = 350;

// Reveals (or, run in reverse, erases) `target` units over time, driven by
// wall-clock elapsed time rather than a chain of dependent setTimeouts.
// Each poll recomputes how many units SHOULD be visible right now from
// actual elapsed time and jumps straight there — so if the tab is busy and
// a poll fires late, the next one catches up in a single step instead of
// needing to run one timeout per remaining character. A long chain of
// individually-delayable timeouts (e.g. one per banner character) is
// exactly what let heavier pages compound into a stall that looked like a
// permanent freeze; this makes total duration robust to that regardless of
// how contended the main thread is.
function useElapsedCount(target, rate, resetKey, active = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active || target <= 0) {
      setCount(0);
      return undefined;
    }
    const startTime = performance.now();
    let cancelled = false;
    let timer;
    const poll = Math.max(1, Math.min(rate, 40));
    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - startTime;
      const next = Math.min(target, Math.floor(elapsed / rate));
      setCount(next);
      if (next < target) {
        timer = setTimeout(tick, poll);
      }
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, target, rate, resetKey]);

  return count;
}

function sliceSegments(segments, revealed) {
  const out = [];
  let used = 0;
  for (const seg of segments) {
    if (used >= revealed) break;
    const text = seg.t.slice(0, revealed - used);
    if (text) out.push({ t: text, c: seg.c });
    used += seg.t.length;
  }
  return out;
}

// Splits a command string into its executable (first word) and arguments,
// so the program name reads brighter than its arguments, like a real
// shell's syntax highlighting.
function commandSegments(cmd) {
  const boundary = cmd.indexOf(' ') === -1 ? cmd.length : cmd.indexOf(' ');
  return [
    { t: cmd.slice(0, boundary), c: 'command-exec' },
    { t: cmd.slice(boundary), c: 'command' },
  ];
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function Terminal() {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  // Hero sits at the very top of the page, so this stays true almost all
  // of the time — it only matters once the user has scrolled far enough
  // down (About/Experience/Projects/Skills/Contact) that re-render churn
  // from these timers is pure waste. Stops (and cleanly restarts) rather
  // than merely hides, same contract as useElapsedCount's existing
  // `active` param below.
  const inView = useInViewport(rootRef, { rootMargin: '200px 0px' });

  // Connection header text — recomputed from `t` so a language switch
  // updates it immediately, exactly like every other translated string
  // below (see CONNECTION_LINE_KEYS above for why this isn't a module
  // constant anymore).
  const connectionLines = useMemo(
    () => CONNECTION_LINE_KEYS.map(({ key, c, prefix }) => ({
      t: `${prefix ?? ''}${t(`hero.terminal.connection.${key}`)}`,
      c,
    })),
    [t]
  );

  // The looping cycle: whoami's banner, then three short status lines,
  // then a directory listing, forever.
  const cycle = useMemo(() => {
    const role = t('contact.values.role');
    const location = t('contact.values.location');
    const uptime = t('hero.terminal.uptime');
    const featuredProjects = FEATURED_PROJECT_KEYS.map((key) => t(`hero.terminal.featuredProjects.${key}`));
    return [
      { id: 'whoami', cmd: WHOAMI_CMD, kind: 'banner', text: NAME_BANNER },
      { id: 'role', cmd: 'echo $ROLE', kind: 'segments', text: role, segments: [{ t: role, c: 'text' }] },
      { id: 'host', cmd: 'hostnamectl', kind: 'segments', text: location, segments: [{ t: location, c: 'text' }] },
      { id: 'uptime', cmd: 'uptime', kind: 'segments', text: uptime, segments: [{ t: uptime, c: 'status' }] },
      {
        id: 'ls',
        cmd: 'ls featured_projects',
        kind: 'segments',
        text: featuredProjects.join(' '),
        segments: featuredProjects.map((name, i) => ({ t: name + (i < featuredProjects.length - 1 ? ' ' : ''), c: 'file' })),
      },
    ];
  }, [t]);

  // Connection: runs once, ever. Reveal counts hold at their finished
  // values forever afterward — the block is never hidden or reset.
  const sshRevealedCount = useElapsedCount(SSH_CMD.length, SSH_RATE, 'ssh', !reducedMotion && inView);
  const linesRevealed = useElapsedCount(
    connectionLines.length,
    LINE_RATE,
    'lines',
    !reducedMotion && inView && sshRevealedCount >= SSH_CMD.length
  );
  const connected = linesRevealed >= connectionLines.length;

  // The live cycle below the connection header: exactly one command's
  // prompt + output on screen at a time. 'phase' walks through
  // cmd-typing -> output-typing -> output-shown -> output-erasing ->
  // cmd-erasing -> (next command) cmd-typing, forever. Every appearance and
  // disappearance in this cycle is a character count driving a string
  // slice — never opacity, never a transform — so typing in mirrors
  // erasing out exactly, on both the command and its output.
  const [cycleIndex, setCycleIndex] = useState(0);
  const [phase, setPhase] = useState('cmd-typing');
  const current = cycle[cycleIndex % cycle.length];

  // Reduced motion: freeze on one settled, meaningful frame — connected,
  // whoami already run, banner already showing — with no typing, deleting,
  // or looping at all.
  useEffect(() => {
    if (!reducedMotion) return;
    setCycleIndex(0);
    setPhase('output-shown');
  }, [reducedMotion]);

  const cycleKey = `${cycleIndex}`;
  const typingActive = !reducedMotion && inView && connected && phase === 'cmd-typing';
  const outputTypingActive = !reducedMotion && inView && connected && phase === 'output-typing';
  const outputErasingActive = !reducedMotion && inView && connected && phase === 'output-erasing';
  const cmdErasingActive = !reducedMotion && inView && connected && phase === 'cmd-erasing';

  const cmdTypedCount = useElapsedCount(current.cmd.length, CMD_RATE, cycleKey, typingActive);
  const outputTypedCount = useElapsedCount(current.text.length, OUTPUT_TYPE_RATE, cycleKey, outputTypingActive);
  const outputEraseCount = useElapsedCount(current.text.length, DELETE_RATE, cycleKey, outputErasingActive);
  const cmdEraseCount = useElapsedCount(current.cmd.length, DELETE_RATE, cycleKey, cmdErasingActive);

  // Advance the phase once each stage's reveal/erase finishes. These are
  // single, one-shot timeouts (a pause between stages) — not a chain, so
  // they aren't vulnerable to the same compounding delay; a late fire just
  // shifts the pause slightly, it can't stall the whole sequence.
  useEffect(() => {
    if (reducedMotion || !inView || !connected) return undefined;
    let timer;
    if (phase === 'cmd-typing' && cmdTypedCount >= current.cmd.length) {
      timer = setTimeout(() => setPhase('output-typing'), current.kind === 'banner' ? PRE_BANNER_DELAY : PRE_OUTPUT_DELAY);
    } else if (phase === 'output-typing' && outputTypedCount >= current.text.length) {
      setPhase('output-shown');
    } else if (phase === 'output-shown') {
      timer = setTimeout(() => setPhase('output-erasing'), current.kind === 'banner' ? BANNER_HOLD : OUTPUT_HOLD);
    } else if (phase === 'output-erasing' && outputEraseCount >= current.text.length) {
      setPhase('cmd-erasing');
    } else if (phase === 'cmd-erasing' && cmdEraseCount >= current.cmd.length) {
      timer = setTimeout(() => {
        setCycleIndex((i) => i + 1);
        setPhase('cmd-typing');
      }, NEXT_COMMAND_DELAY);
    }
    return () => clearTimeout(timer);
  }, [reducedMotion, inView, connected, phase, current, cmdTypedCount, outputTypedCount, outputEraseCount, cmdEraseCount]);

  const sshRevealed = reducedMotion ? SSH_CMD.length : sshRevealedCount;
  const linesRevealedFinal = reducedMotion ? connectionLines.length : linesRevealed;
  const sshCursorOn = !reducedMotion && !connected && sshRevealed < SSH_CMD.length;
  const sshSegments = sliceSegments(commandSegments(SSH_CMD), sshRevealed);

  // The command + its output are one terminal block: once typed, the
  // command stays fully visible through output-typing/output-shown/
  // output-erasing, and only shrinks during its own cmd-erasing phase.
  // cmdTypedCount can't be trusted for that "stays visible" state on its
  // own — useElapsedCount resets an inactive counter to 0 (correct for
  // "hasn't started yet", wrong for "already finished typing") — so
  // every phase after cmd-typing besides cmd-erasing is pinned to the
  // command's full length explicitly instead of reading that counter.
  const cmdRevealed = reducedMotion
    ? WHOAMI_CMD.length
    : phase === 'cmd-typing'
      ? cmdTypedCount
      : phase === 'cmd-erasing'
        ? current.cmd.length - cmdEraseCount
        : current.cmd.length;
  const cmdSegments = sliceSegments(commandSegments(current.cmd), cmdRevealed);

  const outputRevealed = reducedMotion
    ? NAME_BANNER.length
    : phase === 'output-typing'
      ? outputTypedCount
      : phase === 'output-shown'
        ? current.text.length
        : phase === 'output-erasing'
          ? current.text.length - outputEraseCount
          : phase === 'cmd-erasing'
            ? 0
            : 0;
  const outputVisible = (reducedMotion || connected) && outputRevealed > 0;

  // The cursor sits at whichever edge is currently being edited: after the
  // command while typing/erasing the command, after the output while
  // typing/erasing the output. Off entirely during the 'output-shown' hold,
  // same as before.
  const cursorOn =
    !reducedMotion &&
    connected &&
    (phase === 'cmd-typing' || phase === 'output-typing' || phase === 'output-erasing' || phase === 'cmd-erasing');
  const cursorAfterOutput = phase === 'output-typing' || phase === 'output-erasing';
  const cursorAfterCommand = !cursorAfterOutput;

  return (
    <div className="hero-terminal-stage" dir="ltr" ref={rootRef}>
      <div className="hero-terminal-connecting">
        <div className="hero-terminal-line">
          <span className="term-punct">{LOCAL_PROMPT}</span>
          {sshSegments.map((s, j) => (
            <span key={j} className={`term-${s.c}`}>
              {s.t}
            </span>
          ))}
          {sshCursorOn && <span className="term-cursor" />}
        </div>
        {connectionLines.slice(0, linesRevealedFinal).map((line, i) => (
          <div className="hero-terminal-line" key={i}>
            <span className={`term-${line.c}`}>{line.t}</span>
          </div>
        ))}
      </div>

      {(reducedMotion || connected) && (
        <div className="hero-terminal-active">
          <div className="hero-terminal-line">
            <span className="term-prompt">{PROMPT_TEXT}</span>
            {cmdSegments.map((s, j) => (
              <span key={j} className={`term-${s.c}`}>
                {s.t}
              </span>
            ))}
            {cursorOn && cursorAfterCommand && <span className="term-cursor" />}
          </div>

          {outputVisible && (
            <div className="hero-terminal-output">
              {current.kind === 'banner' ? (
                // The banner glyphs themselves are Latin ASCII art and stay
                // that way in every language (see GLYPHS above) — but the
                // accessible name announced to screen readers is real
                // content, not shell/art, so it comes from the same
                // already-localized name used everywhere else (whoami's own
                // output in Contact) rather than a second hardcoded "FAHAD".
                <pre className="hero-ascii-banner" aria-label={t('contact.values.name')}>
                  {current.text.slice(0, outputRevealed)}
                </pre>
              ) : (
                <div className="hero-terminal-line">
                  {sliceSegments(current.segments, outputRevealed).map((s, j) => (
                    <span key={j} className={`term-${s.c}`}>
                      {s.t}
                    </span>
                  ))}
                  {cursorOn && cursorAfterOutput && <span className="term-cursor" />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
