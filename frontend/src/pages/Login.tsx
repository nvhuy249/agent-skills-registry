import { useState } from "react";
import { login } from "../api/auth";
import { signup } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handlesubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "login") {
      const res = await login(loginForm.email, loginForm.password);
      if ("error" in res) {
        setError(res.error);
      } else {
        // Redirect or update UI on successful login
        localStorage.setItem("userId", String(res.userId));
        localStorage.setItem("username", loginForm.email);
        navigate("/skills");
      }
    } else {
      if (signupForm.password !== signupForm.confirm) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      const res = await signup(signupForm.email, signupForm.password);
      if ("error" in res) {
        setError(res.error);
      } else {
        // Redirect or update UI on successful signup
        localStorage.setItem("userId", String(res.userId));
        localStorage.setItem("username", signupForm.email);
        navigate("/skills");
      }
    }
    setLoading(false);
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30";
  const primaryButton =
    "w-full rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50";
  const switchButton =
    "w-full rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:text-indigo-200";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="relative isolate w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative grid grid-cols-2" aria-live="polite">
            <section
              className={`relative z-10 p-10 transition-opacity duration-300 ${
                mode === "login" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <p className="text-sm font-medium text-indigo-300">Welcome back</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Log in</h1>
              <p className="mt-2 text-slate-400">
                Access your skills and continue where you left off.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handlesubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="login-email">
                    Email
                  </label>
                  <input
                    id="login-email"
                    name="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputClass}
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="login-password">
                    Password
                  </label>
                  <input
                    id="login-password"
                    name="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={inputClass}
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button className={primaryButton} type="submit" disabled={loading}>
                    Log in
                  </button>
                  {loading && <p className="text-sm text-slate-400">Logging In...</p>}
                  <button
                    className={switchButton}
                    type="button"
                    onClick={() => setMode("signup")}
                  >
                    Go to sign up
                  </button>
                </div>
              </form>
            </section>

            <section
              className={`relative z-10 p-10 transition-opacity duration-300 ${
                mode === "signup" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <p className="text-sm font-medium text-cyan-300">New here?</p>
              <h1 className="mt-1 text-3xl font-semibold text-white">Create account</h1>
              <p className="mt-2 text-slate-400">
                Start publishing and saving skills with a free account.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handlesubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="signup-email">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    name="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    className={inputClass}
                    value={signupForm.email}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="signup-password">
                    Password
                  </label>
                  <input
                    id="signup-password"
                    name="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                    value={signupForm.password}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200" htmlFor="signup-confirm">
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm"
                    name="signup-confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    className={inputClass}
                    value={signupForm.confirm}
                    onChange={(event) =>
                      setSignupForm((prev) => ({ ...prev, confirm: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button className={primaryButton} type="submit" disabled={loading}>
                    Create account
                  </button>
                  {loading && <p className="text-sm text-slate-400">Signing Up...</p>}
                  <button
                    className={switchButton}
                    type="button"
                    onClick={() => setMode("login")}
                  >
                    Back to log in
                  </button>
                </div>
              </form>
            </section>
          </div>

          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className={`absolute inset-y-0 left-0 w-1/2 rounded-3xl bg-slate-950/60 backdrop-blur transition-transform duration-500 ${
                mode === "login" ? "translate-x-full" : "translate-x-0"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
