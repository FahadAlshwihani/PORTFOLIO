import React from "react";
import StaggeredMenu from "./ui/StaggeredMenu";
// ✅ Define menu items once
const menuItems = [
  { label: "Home", link: "/#home" },
  { label: "About", link: "/#about" },
  { label: "Projects", link: "/#projects" },
  { label: "Skills", link: "/#skills" },
  { label: "Blog", link: "/#blog" },
  { label: "Contact", link: "/#contact" },
];


const socialItems = [
  { label: "LinkedIn", link: "https://linkedin.com/in/fahad-alshwihani" },
  { label: "GitHub", link: "https://github.com/FahadAlshwihani" },
];

export default function Header({ isFixed }) {
  return (
    <StaggeredMenu
      position="right"
      colors={["#B19EEF", "#5227FF", "#1A1528"]}
      accentColor="#5227FF"
      menuButtonColor="#fff"
      openMenuButtonColor="#000000ff"
      isFixed={isFixed}
      items={menuItems}
      socialItems={socialItems}
      displaySocials={true}
      displayItemNumbering={true}
    />
  );
}
