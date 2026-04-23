"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const FEATURES = [
  "Find players near you instantly",
  "Organize matches & tournaments",
  "Manage teams & bookings",
  "Track stats & performance",
];

export default function AuthPage() {
  const router  = useRouter();
  const [tab,    setTab]    = useState("login");
  const [login,  setLogin]  = useState({ email: "", password: "" });
  const [reg,    setReg]    = useState({ fullName: "", email: "", password: "" });
  const [status, setStatus] = useState("");
  const [isErr,  setIsErr]  = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = (msg, err = false) => { setStatus(msg); setIsErr(err); };

  const onLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("user/auth/login", { method: "POST", body: login });
      toast("Login successful! Redirecting…");
      router.replace("/");
    } catch (err) {
      toast(err.message, true);
    } finally { setLoading(false); }
  };

  const onRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("user/auth/register", { method: "POST", body: reg });
      toast("Account created! Redirecting…");
      router.replace("/");
    } catch (err) {
      toast(err.message, true);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-outer">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-hero-icon">⚡</div>
        <h1 className="auth-hero-title">Your Sports<br />Command Center</h1>
        <p className="auth-hero-desc">
          Connect with players, build teams, run tournaments, and book grounds —
          all in one premium platform built for serious athletes.
        </p>
        <div className="auth-features">
          {FEATURES.map((f) => (
            <div className="auth-feature" key={f}>
              <div className="auth-feature-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-box fade-up">
          <h2 className="auth-box-title">
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="auth-box-sub">
            {tab === "login"
              ? "Sign in to access your dashboard."
              : "Join thousands of athletes on SportsHub."}
          </p>

          {/* TABS */}
          <div className="auth-tab-row">
            <button
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => { setTab("login"); setStatus(""); }}
            >Sign In</button>
            <button
              className={`auth-tab${tab === "register" ? " active" : ""}`}
              onClick={() => { setTab("register"); setStatus(""); }}
            >Register</button>
          </div>

          {tab === "login" ? (
            <form className="form-stack" onSubmit={onLogin}>
              <label>
                Email Address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  required
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary btn-full"
                style={{ marginTop: 4 }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>
          ) : (
            <form className="form-stack" onSubmit={onRegister}>
              <label>
                Full Name
                <input
                  placeholder="John Doe"
                  value={reg.fullName}
                  onChange={(e) => setReg({ ...reg, fullName: e.target.value })}
                  required
                />
              </label>
              <label>
                Email Address
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={reg.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  placeholder="Choose a strong password"
                  value={reg.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  required
                />
              </label>
              <button
                type="submit"
                className="btn btn-green btn-full"
                style={{ marginTop: 4 }}
                disabled={loading}
              >
                {loading ? "Creating account…" : "Create Account →"}
              </button>
            </form>
          )}

          {status && (
            <p className={`status-bar mt-4${isErr ? " error" : ""}`}>{status}</p>
          )}

          <p className="text-muted text-sm mt-4" style={{ textAlign: "center" }}>
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              onClick={() => { setTab(tab === "login" ? "register" : "login"); setStatus(""); }}
            >
              {tab === "login" ? "Register here" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
