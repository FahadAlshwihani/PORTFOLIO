import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { siWhatsapp } from "simple-icons";
import "../styles/ui/Terminal.css";
import "../styles/contact.css";

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
const WHATSAPP_NUMBER = "966542630112";
const RESUME_HREF = "/resume.pdf";

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

const Contact = () => {
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

  const opportunities = t("contact.values.opportunities", { returnObjects: true });

  return (
    <section className={`contact-section${isVisible ? " is-visible" : ""}`} ref={sectionRef}>
      <div className="contact-terminal" dir="ltr">
        <div className="contact-terminal-header">
          <div className="contact-terminal-dots" aria-hidden="true">
            <span className="contact-dot-close">×</span>
            <span className="contact-dot-minimize">–</span>
            <span className="contact-dot-maximize">+</span>
          </div>
          <span className="contact-terminal-title">{WINDOW_TITLE}</span>
        </div>

        <div className="contact-terminal-body">
          <div className="contact-block">
            <PromptLine command={COMMANDS.whoami} />
            <p className="contact-output">{t("contact.values.name")}</p>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.role} />
            <p className="contact-output">{t("contact.values.role")}</p>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.location} />
            <p className="contact-output">{t("contact.values.location")}</p>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.status} />
            <p className="contact-output contact-output--status">● {t("contact.values.status")}</p>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.opportunities} />
            <div className="contact-output contact-listing">
              {opportunities.map((name, i) => (
                <p className="contact-dir" key={i}>{name}/</p>
              ))}
            </div>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.contact} />
            <div className="contact-output contact-listing">
              <p className="contact-file">Resume.pdf</p>
              <p className="contact-file">WhatsApp</p>
            </div>

            <div className="contact-actions">
              <a className="contact-action" href={RESUME_HREF} download>
                <PdfIcon />
                <span className="contact-action-text">
                  <span className="contact-action-title">{t("contact.actions.resumeTitle")}</span>
                  <span className="contact-action-subtitle">{t("contact.actions.resumeSubtitle")}</span>
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
                  <span className="contact-action-title">{t("contact.actions.whatsappTitle")}</span>
                  <span className="contact-action-subtitle">{t("contact.actions.whatsappSubtitle")}</span>
                </span>
              </a>
            </div>

            <p className="contact-note">{t("contact.note")}</p>
          </div>

          <div className="contact-block">
            <PromptLine command={COMMANDS.exit} />
            <div className="contact-output contact-listing">
              {EXIT_MESSAGES.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="contact-line contact-final-line">
              <span className="term-cursor" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
