import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

export type NavItem = {
  label: string;
  to: string;
};

type NavBarProps = {
  brand?: string | ReactNode;
  links: NavItem[];
  rightSlot?: ReactNode;
};

export default function NavBar({
  brand = "Agent Skills Registry",
  links,
  rightSlot,
}: NavBarProps) {
  const brandContent =
    typeof brand === "string" ? (
      <NavLink to="/" className="navbar__brand-link">
        {brand}
      </NavLink>
    ) : (
      brand
    );

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">{brandContent}</div>
        <nav className="navbar__links" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                ["navbar__link", isActive ? "navbar__link--active" : ""]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {rightSlot ? <div className="navbar__actions">{rightSlot}</div> : null}
      </div>
    </header>
  );
}
