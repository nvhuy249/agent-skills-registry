import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";
import type { NavItem } from "./components/NavBar";
import "./App.css";

const navLinks: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Login", to: "/login" },
  { label: "Public Skills", to: "/public" },
  { label: "My Skills", to: "/skills" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar links={navLinks} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
