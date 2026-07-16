import { useTranslation } from "react-i18next";
import { siWhatsapp, siGithub } from "simple-icons";
import Reveal from "../../components/ui/Reveal/Reveal";
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

const Contact = () => {
  const { t } = useTranslation();

  const opportunities = t("contact.values.opportunities", { returnObjects: true });

  return (
    <Reveal as="section" className="contact-section">
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
              <p className="contact-file">LinkedIn</p>
              <p className="contact-file">GitHub</p>
            </div>

            <div className="contact-actions">
              <a className="contact-action" href={RESUME_HREF} download={RESUME_FILENAME}>
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

              <a
                className="contact-action"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                <LinkedInIcon />
                <span className="contact-action-text">
                  <span className="contact-action-title">{t("contact.actions.linkedinTitle")}</span>
                  <span className="contact-action-subtitle">{t("contact.actions.linkedinSubtitle")}</span>
                </span>
              </a>

              <a
                className="contact-action"
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                <GitHubIcon />
                <span className="contact-action-text">
                  <span className="contact-action-title">{t("contact.actions.githubTitle")}</span>
                  <span className="contact-action-subtitle">{t("contact.actions.githubSubtitle")}</span>
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
    </Reveal>
  );
};

export default Contact;
