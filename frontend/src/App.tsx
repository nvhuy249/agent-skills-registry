import { Outlet } from "react-router-dom";
import NavBar from "./components/NavBar";
import type { NavItem } from "./components/NavBar";
import "./App.css";

const navLinks: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Login", to: "/login" },
  { label: "My Skills", to: "/skills" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavBar links={navLinks} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Agent Skills Registry</h1>
        <p className="mt-2 text-slate-400">
          Manage and browse skills. Use the navbar to navigate.
        </p>
        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
