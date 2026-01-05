import { Outlet } from "react-router-dom";
import "./App.css";

export default function AppAuth() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="flex min-h-screen items-center justify-center px-4">
        <Outlet />
      </main>
    </div>
  );
}
