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
    <>
      <NavBar links={navLinks} />
      <main>
        <h1>Agent Skills Registry</h1>
        <Outlet />
      </main>
    </>
  );
}
