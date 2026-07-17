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
const TypedLine = ({ className, text, onDone }) => (
  <TextType
    as="p"
    className={className}
    text={text}
    loop={false}
    typingSpeed={26}
    cursorOnlyWhileTyping
    onSentenceComplete={onDone}
  />
);

// Reveals a set of lines one at a time inside a command's output — each
// stays visible once typed, automatically advancing to the next the
// instant the previous finishes. This is the terminal's own automatic,
// sequential "auto-play" (mirrors Hero's cadence): nothing here is tied to
// scroll position, it only runs once a line becomes this component's turn.
const TypedLines = ({ lines, reducedMotion, onAllDone }) => {
  const [lineIndex, setLineIndex] = useState(0);

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

// Everything that plays out once the section is in view: intro line →
// terminal fade-in → each command's output typing in sequence. Remounted
// with a fresh `key` from Contact below every time the section re-enters
// the viewport, which is what makes the whole thing replay from scratch —
// simpler and more reliable than manually resetting a dozen phase flags.
const ContactSequence = ({ t, opportunities, reducedMotion }) => {
  const blocks = buildBlocks(t, opportunities);

  const [introDone, setIntroDone] = useState(reducedMotion);
  const [terminalVisible, setTerminalVisible] = useState(reducedMotion);
  // Reduced motion: every block should already be showing, statically, with
  // nothing left to advance — starting past the last index means the
  // `index > blockIndex` gate below never hides a block and `isActive`
  // never matches a real index, so every block renders via its static
  // (non-typed) branch immediately.
  const [blockIndex, setBlockIndex] = useState(reducedMotion ? blocks.length : 0);
  const [contactExtraVisible, setContactExtraVisible] = useState(reducedMotion);

  // Flips one frame after the terminal mounts so the opacity/transform
  // transition actually has a "before" state to animate from, instead of
  // mounting already in its final, `.is-visible` state.
  useEffect(() => {
    if (!introDone || reducedMotion) return undefined;
    const raf = requestAnimationFrame(() => setTerminalVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [introDone, reducedMotion]);

  const handleBlockDone = (block, index) => {
    if (block.key === "contact") setContactExtraVisible(true);
    setBlockIndex((v) => Math.max(v, index + 1));
  };

  return (
    <>
      <div className="contact-intro" dir="ltr">
        <div className="contact-line">
          <span className="prompt-dollar">$</span>
          <span className="contact-command">{INTRO_COMMAND}</span>
        </div>
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
            onSentenceComplete={() => setIntroDone(true)}
          />
        )}
      </div>

      {introDone && (
        <div className={`contact-terminal${terminalVisible ? " is-visible" : ""}`} dir="ltr">
          <div className="contact-terminal-header">
            <div className="contact-terminal-dots" aria-hidden="true">
              <span className="contact-dot-close">×</span>
              <span className="contact-dot-minimize">–</span>
              <span className="contact-dot-maximize">+</span>
            </div>
            <span className="contact-terminal-title">{WINDOW_TITLE}</span>
          </div>

          <div className="contact-terminal-body">
            {blocks.map((block, index) => {
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
      )}
    </>
  );
};

const Contact = () => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const anchorRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [sequenceId, setSequenceId] = useState(0);

  const opportunities = t("contact.values.opportunities", { returnObjects: true });

  // Watches the section independently of Reveal's own observer (which only
  // toggles a CSS class, not something a child can read) purely to detect
  // "just re-entered the viewport" and force the sequence below to replay
  // from scratch — Reveal already handles fading the section itself in and
  // out, so this doesn't duplicate that, it only tracks entry/exit.
  useEffect(() => {
    const el = anchorRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView) setSequenceId((id) => id + 1);
  }, [inView]);

  return (
    <Reveal as="section" className="contact-section">
      {/* Reveal already fades the whole section (intro + terminal, both
          children of this node) in and out as it crosses the viewport —
          that covers "fade out when leaving" for free. This wrapper only
          exists to observe entry/exit and, on first entry, mount the
          sequence below; it never unmounts again on exit, so the already-
          typed transcript just fades out with its ancestor instead of
          popping away, and a fresh `sequenceId` on the *next* entry is
          what makes the whole thing replay from scratch. */}
      <div ref={anchorRef}>
        {sequenceId > 0 && (
          <ContactSequence key={sequenceId} t={t} opportunities={opportunities} reducedMotion={reducedMotion} />
        )}
      </div>
    </Reveal>
  );
};

export default Contact;
