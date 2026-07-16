import Header from "./Header/Header";

// Owns the global shell only: the fixed Header plus whatever page content is
// routed in as children. Footer is intentionally NOT rendered here — it
// stays composed inside EndingScene (see sections/contact/EndingScene.jsx),
// which shares one visual background scene across Contact + Footer.
// Pulling Footer out to this level would break that background effect.
export default function SiteLayout({ children }) {
  return (
    <>
      <Header isFixed={true} />
      {children}
    </>
  );
}
