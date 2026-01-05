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

const baseLinkClasses =
  "rounded-md px-3 py-2 text-sm font-medium transition-colors";
const activeLinkClasses = "bg-slate-800 text-white";
const inactiveLinkClasses =
  "text-slate-300 hover:text-white hover:bg-slate-800/70";

export default function NavBar({
  brand = "Agent Skills Registry",
  links,
  rightSlot,
}: NavBarProps) {
  const brandContent =
    typeof brand === "string" ? (
      <NavLink
        to="/"
        className="text-lg font-semibold tracking-tight text-white no-underline"
      >
        {brand}
      </NavLink>
    ) : (
      brand
    );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="shrink-0">{brandContent}</div>
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  baseLinkClasses,
                  isActive ? activeLinkClasses : inactiveLinkClasses,
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {rightSlot ? (
          <div className="flex items-center gap-2">{rightSlot}</div>
        ) : null}
      </div>
    </header>
  );
}
