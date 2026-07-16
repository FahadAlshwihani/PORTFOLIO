import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { siWhatsapp, siGithub } from "simple-icons";
import useScrollTypeProgress from "../../hooks/useScrollTypeProgress";
import resumeFile from "../../assets/Resume/Fahad_Alshwihani_Full-stack.pdf";
import "../hero/Terminal.css";
import "./Contact.css";

// Same shell-prompt string used in the Hero terminal (Terminal.js) — a
// system string, not content, so it's a JS constant rather than an
// i18next key: it never changes with language, exactly like Hero's own
// PROMPT_TEXT.
const WINDOW_TITLE = "fahad@portfolio:~$";

// The prompt is repeated before every command, colored token-by-token
// like a real shell (user/$ in the site's purple, host in white, the
// connective punctuation muted) — never a bare ">". The prompt itself is
// shell chrome, not something the user "typed", so unlike the command and
// output text below it, it's never part of the typed/deleted transcript —
// it simply appears the instant a block starts.
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
const FILES = ["Resume.pdf", "WhatsApp", "LinkedIn", "GitHub"];

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

function useReducedMotion() {
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
}

// Hands out slices of a fixed character budget in strict document order —
// the single mechanism behind both typing (budget growing with scroll)
// and deleting (budget shrinking with scroll): once the budget runs out
// mid-piece, every later piece in the same block is blocked and renders
// nothing, so pieces can only ever be complete, partially revealed at the
// very end of the visible run, or entirely absent — never revealed out of
// order.
function createSequencer(budget) {
  let remaining = budget;
  let blocked = remaining <= 0;
  return {
    take(text) {
      if (blocked) return { visible: "", cursor: false };
      if (text.length <= remaining) {
        remaining -= text.length;
        const cursor = remaining === 0;
        if (cursor) blocked = true;
        return { visible: text, cursor };
      }
      const visible = text.slice(0, remaining);
      remaining = 0;
      blocked = true;
      return { visible, cursor: true };
    },
    // For the one non-text piece in the transcript (the action cards) —
    // an atomic unit can't be partially "typed", so it only ever reveals
    // once its whole weight is available, exactly like a very wide
    // character that either exists or doesn't.
    takeAtomic(weight) {
      if (blocked || weight > remaining) {
        blocked = true;
        return false;
      }
      remaining -= weight;
      if (remaining === 0) blocked = true;
      return true;
    },
  };
}

const Cursor = () => <span className="term-cursor" />;

const Contact = () => {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();

  const opportunities = t("contact.values.opportunities", { returnObjects: true });

  // One complete, ordered transcript is the single source of truth — the
  // number of visible characters (driven straight from scroll progress,
  // see useScrollTypeProgress) is the only thing that changes on scroll.
  // Rebuilt only when the active language changes, not on every scroll
  // tick — slicing a handful of short strings per render is cheap, but
  // there's no reason to recompute the translated base strings/weights
  // that don't change between scroll frames.
  const { blocks, total } = useMemo(() => {
    const nameValue = t("contact.values.name");
    const roleValue = t("contact.values.role");
    const locationValue = t("contact.values.location");
    const statusText = `● ${t("contact.values.status")}`;
    const noteText = t("contact.note");
    const actionEntries = [
      { title: t("contact.actions.resumeTitle"), subtitle: t("contact.actions.resumeSubtitle") },
      { title: t("contact.actions.whatsappTitle"), subtitle: t("contact.actions.whatsappSubtitle") },
      { title: t("contact.actions.linkedinTitle"), subtitle: t("contact.actions.linkedinSubtitle") },
      { title: t("contact.actions.githubTitle"), subtitle: t("contact.actions.githubSubtitle") },
    ];
    const actionsWeight = actionEntries.reduce((sum, a) => sum + a.title.length + a.subtitle.length, 0);

    const CommandLine = ({ cmdVisible, showCursor }) => (
      <div className="contact-line">
        <Prompt />
        <span className="contact-command">{cmdVisible}</span>
        {showCursor && <Cursor />}
      </div>
    );

    const list = [
      {
        id: "whoami",
        weight: COMMANDS.whoami.length + nameValue.length,
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.whoami);
          const out = seq.take(nameValue);
          return (
            <div className="contact-block" key="whoami">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              {out.visible.length > 0 && (
                <p className="contact-output">
                  {out.visible}
                  {isFrontier && out.cursor && <Cursor />}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "role",
        weight: COMMANDS.role.length + roleValue.length,
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.role);
          const out = seq.take(roleValue);
          return (
            <div className="contact-block" key="role">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              {out.visible.length > 0 && (
                <p className="contact-output">
                  {out.visible}
                  {isFrontier && out.cursor && <Cursor />}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "location",
        weight: COMMANDS.location.length + locationValue.length,
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.location);
          const out = seq.take(locationValue);
          return (
            <div className="contact-block" key="location">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              {out.visible.length > 0 && (
                <p className="contact-output">
                  {out.visible}
                  {isFrontier && out.cursor && <Cursor />}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        weight: COMMANDS.status.length + statusText.length,
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.status);
          const out = seq.take(statusText);
          return (
            <div className="contact-block" key="status">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              {out.visible.length > 0 && (
                <p className="contact-output contact-output--status">
                  {out.visible}
                  {isFrontier && out.cursor && <Cursor />}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "opportunities",
        weight: COMMANDS.opportunities.length + opportunities.reduce((sum, name) => sum + name.length + 1, 0),
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.opportunities);
          const lines = opportunities.map((name) => seq.take(`${name}/`));
          return (
            <div className="contact-block" key="opportunities">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              <div className="contact-output contact-listing">
                {lines.map(
                  (line, i) =>
                    line.visible.length > 0 && (
                      <p className="contact-dir" key={i}>
                        {line.visible}
                        {isFrontier && line.cursor && <Cursor />}
                      </p>
                    )
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "contact-files",
        weight:
          COMMANDS.contact.length +
          FILES.reduce((sum, f) => sum + f.length, 0) +
          actionsWeight +
          noteText.length,
        render(chars, isFrontier) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.contact);
          const fileLines = FILES.map((f) => seq.take(f));
          const actionsVisible = seq.takeAtomic(actionsWeight);
          const note = seq.take(noteText);
          return (
            <div className="contact-block" key="contact-files">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor} />
              <div className="contact-output contact-listing">
                {fileLines.map(
                  (line, i) =>
                    line.visible.length > 0 && (
                      <p className="contact-file" key={i}>
                        {line.visible}
                        {isFrontier && line.cursor && <Cursor />}
                      </p>
                    )
                )}
              </div>

              {actionsVisible && (
                <div className="contact-actions">
                  <a className="contact-action" href={RESUME_HREF} download={RESUME_FILENAME}>
                    <PdfIcon />
                    <span className="contact-action-text">
                      <span className="contact-action-title">{actionEntries[0].title}</span>
                      <span className="contact-action-subtitle">{actionEntries[0].subtitle}</span>
                    </span>
                  </a>

                  <a
                    className="contact-action"
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <WhatsAppIcon />
                    <span className="contact-action-text">
                      <span className="contact-action-title">{actionEntries[1].title}</span>
                      <span className="contact-action-subtitle">{actionEntries[1].subtitle}</span>
                    </span>
                  </a>

                  <a className="contact-action" href={LINKEDIN_URL} target="_blank" rel="noreferrer noopener">
                    <LinkedInIcon />
                    <span className="contact-action-text">
                      <span className="contact-action-title">{actionEntries[2].title}</span>
                      <span className="contact-action-subtitle">{actionEntries[2].subtitle}</span>
                    </span>
                  </a>

                  <a className="contact-action" href={GITHUB_URL} target="_blank" rel="noreferrer noopener">
                    <GitHubIcon />
                    <span className="contact-action-text">
                      <span className="contact-action-title">{actionEntries[3].title}</span>
                      <span className="contact-action-subtitle">{actionEntries[3].subtitle}</span>
                    </span>
                  </a>
                </div>
              )}

              {note.visible.length > 0 && (
                <p className="contact-note">
                  {note.visible}
                  {isFrontier && note.cursor && <Cursor />}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "exit",
        weight: COMMANDS.exit.length + EXIT_MESSAGES.reduce((sum, m) => sum + m.length, 0),
        render(chars, isFrontier, weight) {
          const seq = createSequencer(chars);
          const cmd = seq.take(COMMANDS.exit);
          const lines = EXIT_MESSAGES.map((m) => seq.take(m));
          const complete = chars >= weight;
          return (
            <div className="contact-block" key="exit">
              <CommandLine cmdVisible={cmd.visible} showCursor={isFrontier && cmd.cursor && !complete} />
              <div className="contact-output contact-listing">
                {lines.map(
                  (line, i) =>
                    line.visible.length > 0 && (
                      <p key={i}>
                        {line.visible}
                        {isFrontier && line.cursor && !complete && <Cursor />}
                      </p>
                    )
                )}
              </div>
              {complete && (
                <div className="contact-line contact-final-line">
                  <Cursor />
                </div>
              )}
            </div>
          );
        },
      },
    ];

    return { blocks: list, total: list.reduce((sum, b) => sum + b.weight, 0) };
  }, [t, opportunities]);

  const visibleChars = useScrollTypeProgress(sectionRef, total, { disabled: reducedMotion });

  // The block whose range currently contains the scroll boundary — the
  // only block allowed to show the blinking cursor. Every earlier block
  // is fully typed already (no cursor); every later one hasn't started.
  let offset = 0;
  let frontierIndex = -1;
  blocks.forEach((block, i) => {
    if (visibleChars > offset) frontierIndex = i;
    offset += block.weight;
  });

  offset = 0;
  const rendered = blocks.map((block, i) => {
    const charsInBlock = Math.min(Math.max(visibleChars - offset, 0), block.weight);
    offset += block.weight;
    if (charsInBlock <= 0) return null;
    return block.render(charsInBlock, i === frontierIndex, block.weight);
  });

  return (
    <section className="contact-section" ref={sectionRef}>
      <div className="contact-terminal" dir="ltr">
        <div className="contact-terminal-header">
          <div className="contact-terminal-dots" aria-hidden="true">
            <span className="contact-dot-close">×</span>
            <span className="contact-dot-minimize">–</span>
            <span className="contact-dot-maximize">+</span>
          </div>
          <span className="contact-terminal-title">{WINDOW_TITLE}</span>
        </div>

        <div className="contact-terminal-body">{rendered}</div>
      </div>
    </section>
  );
};

export default Contact;
