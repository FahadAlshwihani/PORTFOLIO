import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { siWhatsapp, siGithub } from "simple-icons";
import Reveal from "../../components/ui/Reveal/Reveal";
import TextType from "../../components/ui/TextType/TextType";
import resumeFile from "../../assets/Resume/Fahad_Alshwihani_Full-stack.pdf";
import "../hero/Terminal.css";
import "./Contact.css";

// Same reduced-motion detection Terminal.jsx already uses (not shared —
// each terminal-like section keeps its own small, local copy).
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
};

// Intro line above the terminal — a natural continuation of the Hero SSH
// session ("launching" the interface the terminal below is about to show).
// Terminal output, not UI copy: stays English in both languages, same
// reasoning as COMMANDS/EXIT_MESSAGES below.
const INTRO_COMMAND = "./contact";
const INTRO_STATUS = "Launching communication interface...";

// Same shell-prompt string used in the Hero terminal (Terminal.js) — a
// system string, not content, so it's a JS constant rather than an
// i18next key: it never changes with language, exactly like Hero's own
// PROMPT_TEXT.
const WINDOW_TITLE = "fahad@portfolio:~$";

// The prompt is repeated before every command, colored token-by-token
// like a real shell (user/$ in the site's purple, host in white, the
// connective punctuation muted) — never a bare ">".
const PROMPT_PARTS = [
  { t: "fahad", cls: "prompt-user" },
  { t: "@", cls: "prompt-at" },
  { t: "portfolio", cls: "prompt-host" },
  { t: ":~", cls: "prompt-path" },
  { t: "$", cls: "prompt-dollar" },
];

const IntroCommandLine = () => (
  <div className="contact-line">
    <span className="prompt-dollar">$</span>
    <span className="contact-command">{INTRO_COMMAND}</span>
  </div>
);

const Prompt = () => (
  <span className="contact-prompt-full">
    {PROMPT_PARTS.map((p) => (
      <span key={p.cls} className={p.cls}>
        {p.t}
      </span>
    ))}
  </span>
);

const PromptLine = ({ command }) => (
  <div className="contact-line">
    <Prompt />
    <span className="contact-command">{command}</span>
  </div>
);

// Real shell commands, never translated — only their printed output
// (pulled from i18next below) changes with language.
const COMMANDS = {
  whoami: "whoami",
  role: "echo $ROLE",
  location: "hostnamectl",
  status: "systemctl status career",
  opportunities: "ls opportunities/",
  contact: "ls contact/",
  exit: "exit",
};

// Terminal output, not UI copy — stays English in both languages, same
// reasoning as the commands themselves.
const EXIT_MESSAGES = ["Session terminated.", "Connection closed."];

const WHATSAPP_PATH = siWhatsapp.svg.match(/<path d="([^"]+)"/)?.[1] ?? "";
const WHATSAPP_HEX = `#${siWhatsapp.hex}`;
const WHATSAPP_NUMBER = "966509739309";
const RESUME_HREF = resumeFile;
const RESUME_FILENAME = "Fahad_Alshwihani_Full-stack.pdf";

const GITHUB_PATH = siGithub.svg.match(/<path d="([^"]+)"/)?.[1] ?? "";
// GitHub's real brand mark is near-black (#181717) — invisible against this
// dark UI on hover, so white stands in for it here (same convention GitHub
// itself uses for dark-mode marks), keeping the same hover-highlight
// mechanic as WhatsApp/LinkedIn without the icon vanishing.
const GITHUB_HEX = "#ffffff";
const GITHUB_URL = "https://github.com/FahadAlshwihani";

// simple-icons dropped the LinkedIn glyph (trademark takedown), so this
// one is hand-inlined the same way PdfIcon is — no package provides it.
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const LINKEDIN_HEX = "#0A66C2";
const LINKEDIN_URL = "https://www.linkedin.com/in/fahad-alshwihani/";

const PdfIcon = () => (
  <svg className="contact-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M6.5 2.5h7.6L19 7.4V21a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M14.1 2.5V7a.9.9 0 0 0 .9.9h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8.3 13.2h7.4M8.3 16.4h7.4M8.3 10h4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg
    className="contact-action-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    style={{ "--contact-icon-brand": WHATSAPP_HEX }}
  >
    <path d={WHATSAPP_PATH} fill="currentColor" />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    className="contact-action-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    style={{ "--contact-icon-brand": LINKEDIN_HEX }}
  >
    <path d={LINKEDIN_PATH} fill="currentColor" />
  </svg>
);

const GitHubIcon = () => (
  <svg
    className="contact-action-icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    style={{ "--contact-icon-brand": GITHUB_HEX }}
  >
    <path d={GITHUB_PATH} fill="currentColor" />
  </svg>
);

// Types once via the restored TextType and stays fully visible afterward
// (loop=false, no erase) — builds up a transcript line by line instead of
// text rotating in place. Falls back to a static element under reduced
// motion (no typing at all).
const TypedLine = ({ className, text, onDone, active, resetKey }) => (
  <TextType
    as="p"
    className={className}
    text={text}
    loop={false}
    typingSpeed={26}
    active={active}
    resetKey={resetKey}
    onSentenceComplete={onDone}
  />
);

// Reveals a set of lines one at a time inside a command's output — each
// stays visible once typed, automatically advancing to the next the
// instant the previous finishes. This is the terminal's own automatic,
// sequential "auto-play" (mirrors Hero's cadence): nothing here is tied to
// scroll position, it only runs once a line becomes this component's turn.
// `resetKey` covers the edge case where this exact line is still active
// across a replay (so it never actually unmounts) — same state-only replay
// mechanism as TextType itself, not a remount.
const TypedLines = ({ lines, reducedMotion, active, resetKey, onAllDone }) => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (resetKey === undefined) return;
    setLineIndex(0);
  }, [resetKey]);

  if (reducedMotion) {
    return lines.map((line, i) => (
      <p className={line.className} key={i}>{line.text}</p>
    ));
  }

  return lines.slice(0, lineIndex + 1).map((line, i) => (
    i === lineIndex ? (
      <TypedLine
        key={i}
        className={line.className}
        text={line.text}
        active={active}
        resetKey={resetKey}
        onDone={() => {
          if (lineIndex + 1 >= lines.length) onAllDone();
          else setLineIndex((v) => v + 1);
        }}
      />
    ) : (
      <p className={line.className} key={i}>{line.text}</p>
    )
  ));
};

// The commands making up the terminal transcript, in the order they play.
// Data-driven so the sequencing below doesn't hand-roll seven near-identical
// blocks — content/labels/classNames are all unchanged from before, only
// *when* each becomes visible is new.
const buildBlocks = (t, opportunities) => [
  { key: "whoami", command: COMMANDS.whoami, lines: [{ className: "contact-output", text: t("contact.values.name") }] },
  { key: "role", command: COMMANDS.role, lines: [{ className: "contact-output", text: t("contact.values.role") }] },
  { key: "location", command: COMMANDS.location, lines: [{ className: "contact-output", text: t("contact.values.location") }] },
  {
    key: "status",
    command: COMMANDS.status,
    lines: [{ className: "contact-output contact-output--status", text: `● ${t("contact.values.status")}` }],
  },
  {
    key: "opportunities",
    command: COMMANDS.opportunities,
    listing: true,
    lines: opportunities.map((name) => ({ className: "contact-dir", text: `${name}/` })),
  },
  {
    key: "contact",
    command: COMMANDS.contact,
    listing: true,
    lines: [
      { className: "contact-file", text: "Resume.pdf" },
      { className: "contact-file", text: "WhatsApp" },
      { className: "contact-file", text: "LinkedIn" },
      { className: "contact-file", text: "GitHub" },
    ],
  },
  {
    key: "exit",
    command: COMMANDS.exit,
    listing: true,
    lines: EXIT_MESSAGES.map((line) => ({ className: undefined, text: line })),
  },
];

// Invisible duplicate of the fully-settled transcript (every command, its
// final output, the actions, the trailing cursor) — its only job is to
// give `.contact-terminal-body` its true final height the instant the
// terminal mounts, via normal document flow, before any typing starts.
// The real (typing) render below is absolutely positioned on top of it, so
// its own progressively-changing content can never resize the container —
// see the CSS: the ghost is `visibility:hidden` but still takes up space;
// the live layer is `position:absolute; inset:0`, which takes it out of
// flow entirely. `inert` drops it from focus/AT since it's a duplicate.
const TerminalGhost = ({ t, blocks }) => (
  <div className="contact-terminal-body-ghost" aria-hidden="true" inert="">
    {blocks.map((block) => (
      <div className="contact-block" key={block.key}>
        <PromptLine command={block.command} />
        {block.listing ? (
          <div className="contact-output contact-listing">
            {block.lines.map((line, i) => (
              <p className={line.className} key={i}>{line.text}</p>
            ))}
          </div>
        ) : (
          <p className={block.lines[0].className}>{block.lines[0].text}</p>
        )}
        {block.key === "contact" && <ContactActions t={t} />}
        {block.key === "exit" && (
          <div className="contact-line contact-final-line">
            <span className="term-cursor" />
          </div>
        )}
      </div>
    ))}
  </div>
);

const ContactActions = ({ t }) => (
  <>
    <div className="contact-actions">
      <a className="contact-action" href={RESUME_HREF} download={RESUME_FILENAME}>
        <PdfIcon />
        <span className="contact-action-text">
          <span className="contact-action-title">{t("contact.actions.resumeTitle")}</span>
          <span className="contact-action-subtitle">{t("contact.actions.resumeSubtitle")}</span>
        </span>
      </a>

      <a className="contact-action" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer noopener">
        <WhatsAppIcon />
        <span className="contact-action-text">
          <span className="contact-action-title">{t("contact.actions.whatsappTitle")}</span>
          <span className="contact-action-subtitle">{t("contact.actions.whatsappSubtitle")}</span>
        </span>
      </a>

      <a className="contact-action" href={LINKEDIN_URL} target="_blank" rel="noreferrer noopener">
        <LinkedInIcon />
        <span className="contact-action-text">
          <span className="contact-action-title">{t("contact.actions.linkedinTitle")}</span>
          <span className="contact-action-subtitle">{t("contact.actions.linkedinSubtitle")}</span>
        </span>
      </a>

      <a className="contact-action" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
        <GitHubIcon />
        <span className="contact-action-text">
          <span className="contact-action-title">{t("contact.actions.githubTitle")}</span>
          <span className="contact-action-subtitle">{t("contact.actions.githubSubtitle")}</span>
        </span>
      </a>
    </div>

    <p className="contact-note">{t("contact.note")}</p>
  </>
);

// Everything that plays out while the section is in view: intro line →
// terminal fade-in → each command's output typing in sequence. This
// component, the terminal, and the intro are ALL permanently mounted —
// exactly like every other section on the site — for the lifetime of
// Contact. Nothing here ever unmounts or remounts based on visibility;
// leaving the viewport quietly resets this state back to its starting
// values (see the effect below), which is what makes the sequence replay
// cleanly next time it's visible. Every TextType instance gets that same
// reset via `resetKey`, so it restarts through its own internal state too,
// never by being torn down and rebuilt.
const ContactSequence = ({ t, opportunities, reducedMotion, visible }) => {
  const blocks = buildBlocks(t, opportunities);
  const terminalRef = useRef(null);
  const wasVisibleRef = useRef(false);

  const [introDone, setIntroDone] = useState(reducedMotion);
  const [terminalVisible, setTerminalVisible] = useState(reducedMotion);
  // Only flips once the terminal's own fade-in transition has genuinely
  // finished (see the transitionend listener below) — typing must not
  // start while the container is still animating in.
  const [typingStarted, setTypingStarted] = useState(reducedMotion);
  // Reduced motion: every block should already be showing, statically, with
  // nothing left to advance — starting past the last index means the
  // `index > blockIndex` gate below never hides a block and `isActive`
  // never matches a real index, so every block renders via its static
  // (non-typed) branch immediately.
  const [blockIndex, setBlockIndex] = useState(reducedMotion ? blocks.length : 0);
  const [contactExtraVisible, setContactExtraVisible] = useState(reducedMotion);
  // Bumped every time the sequence (re)starts; passed as `resetKey` to every
  // TextType instance so they clear their own displayed text on replay.
  const [replayKey, setReplayKey] = useState(0);

  // Driven by Reveal's own visibility signal (see Contact below), not a
  // second observer. Resets state back to the start on EXIT, not re-entry —
  // while the section is already fading to invisible, so the reset itself
  // is never seen. If it reset on the way back in instead, the terminal
  // (never unmounted, so still fully opaque from the previous playthrough)
  // would visibly fade back out at the exact moment the section fades back
  // in — a flicker. Resetting on exit means everything is already sitting
  // at its starting point by the time the section is visible again, so
  // re-entry just plays the same already-designed forward sequence once.
  useEffect(() => {
    if (reducedMotion) return;
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = visible;
    if (!visible && wasVisible) {
      setIntroDone(false);
      setTerminalVisible(false);
      setTypingStarted(false);
      setBlockIndex(0);
      setContactExtraVisible(false);
      setReplayKey((k) => k + 1);
    }
  }, [visible, reducedMotion]);

  // Flips one frame after the terminal mounts so the opacity/transform
  // transition actually has a "before" state to animate from, instead of
  // mounting already in its final, `.is-visible` state.
  useEffect(() => {
    if (!introDone || reducedMotion) return undefined;
    const raf = requestAnimationFrame(() => setTerminalVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [introDone, reducedMotion]);

  // Waits for the actual `transitionend` of the terminal's own opacity fade
  // (not a duration guess duplicated from the CSS) before letting any
  // typing begin, so the container is fully settled — no longer animating
  // at all — before the text inside starts changing.
  useEffect(() => {
    if (reducedMotion || !terminalVisible) return undefined;
    const el = terminalRef.current;
    if (!el) return undefined;
    const handleTransitionEnd = (e) => {
      if (e.target === el && e.propertyName === "opacity") setTypingStarted(true);
    };
    el.addEventListener("transitionend", handleTransitionEnd);
    return () => el.removeEventListener("transitionend", handleTransitionEnd);
  }, [terminalVisible, reducedMotion]);

  const handleBlockDone = (block, index) => {
    if (block.key === "contact") setContactExtraVisible(true);
    setBlockIndex((v) => Math.max(v, index + 1));
  };

  return (
    <>
      <div className="contact-intro" dir="ltr">
        {/* Same ghost + overlay technique as the terminal body: this
            invisible copy of both final lines is the only thing that gives
            `.contact-intro` its height, reserved from the first frame — the
            animated line below is `position: absolute`, so its growing
            text can never resize this wrapper (or shift the terminal
            below it). */}
        <div className="contact-intro-ghost" aria-hidden="true" inert="">
          <IntroCommandLine />
          <p className="contact-intro-status">{INTRO_STATUS}</p>
        </div>

        <div className="contact-intro-live">
          <IntroCommandLine />
          {reducedMotion ? (
            <p className="contact-intro-status">{INTRO_STATUS}</p>
          ) : (
            <TextType
              as="p"
              className="contact-intro-status"
              text={INTRO_STATUS}
              loop={false}
              typingSpeed={28}
              cursorOnlyWhileTyping
              active={visible}
              resetKey={replayKey}
              onSentenceComplete={() => setIntroDone(true)}
            />
          )}
        </div>
      </div>

      {/* Rendered unconditionally, from this component's very first paint —
          not gated on `introDone`/`terminalVisible` at all. This is the
          fix for the first-reveal-only stutter: `.contact-terminal` has
          `backdrop-filter`, and the ghost below it constructs the entire
          transcript's worth of DOM up front. The first time a backdrop-
          filter element is composited, the browser has to promote it to
          its own layer and actually run the blur — real GPU/compositor
          work. Gating this on scroll position meant paying that cost at
          the exact moment the user reached Contact, competing with Silk/
          FaultyTerminal's own frame budget right then. Rendering it here
          instead means that one-time cost lands at page load, while it's
          `opacity: 0` (the base rule below, unchanged) and invisible —
          off the interaction critical path entirely. Visibility is still
          controlled purely by `terminalVisible` toggling `.is-visible`,
          exactly as before; nothing about the visible sequence changes. */}
      <div
        ref={terminalRef}
        className={`contact-terminal${terminalVisible ? " is-visible" : ""}`}
        dir="ltr"
      >
          <div className="contact-terminal-header">
            <div className="contact-terminal-dots" aria-hidden="true">
              <span className="contact-dot-close">×</span>
              <span className="contact-dot-minimize">–</span>
              <span className="contact-dot-maximize">+</span>
            </div>
            <span className="contact-terminal-title">{WINDOW_TITLE}</span>
          </div>

          <div className="contact-terminal-body">
            <div className="contact-terminal-content">
              <TerminalGhost t={t} blocks={blocks} />

              <div className="contact-terminal-body-live">
                {typingStarted && blocks.map((block, index) => {
                  if (index > blockIndex) return null;
                  const isActive = index === blockIndex;

                  return (
                    <div className="contact-block" key={block.key}>
                      <PromptLine command={block.command} />

                      {block.listing ? (
                        <div className="contact-output contact-listing">
                          {isActive ? (
                            <TypedLines
                              lines={block.lines}
                              reducedMotion={reducedMotion}
                              active={visible}
                              resetKey={replayKey}
                              onAllDone={() => handleBlockDone(block, index)}
                            />
                          ) : (
                            block.lines.map((line, i) => (
                              <p className={line.className} key={i}>{line.text}</p>
                            ))
                          )}
                        </div>
                      ) : isActive && !reducedMotion ? (
                        <TypedLine
                          className={block.lines[0].className}
                          text={block.lines[0].text}
                          active={visible}
                          resetKey={replayKey}
                          onDone={() => handleBlockDone(block, index)}
                        />
                      ) : (
                        <p className={block.lines[0].className}>{block.lines[0].text}</p>
                      )}

                      {block.key === "contact" && contactExtraVisible && <ContactActions t={t} />}

                      {block.key === "exit" && index < blockIndex && (
                        <div className="contact-line contact-final-line">
                          <span className="term-cursor" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
    </>
  );
};

const Contact = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const opportunities = t("contact.values.opportunities", { returnObjects: true });

  // Same single observer every other section uses — Reveal's own — just
  // also reporting its visibility transitions up so the sequence below
  // knows when to replay. No second observer, no key, nothing here ever
  // unmounts: the DOM stays exactly as stable as any other section's.
  return (
    <Reveal as="section" className="contact-section" onVisibleChange={setVisible}>
      {/* Static, always in the DOM — deliberately outside the sequencing/
          typing state below, so it can't be affected by (or accidentally
          affect) the replay logic. Visually hidden because this section's
          real content is the terminal itself, not a traditional heading;
          see .visually-hidden's comment. Reuses the nav's existing
          "Contact" translation rather than adding a new one. */}
      <h2 className="visually-hidden">{t("navigation.contact")}</h2>
      <ContactSequence t={t} opportunities={opportunities} reducedMotion={reducedMotion} visible={visible} />
    </Reveal>
  );
};

export default Contact;
