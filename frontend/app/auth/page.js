"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function AuthPage() {
  const router = useRouter();
  const [register, setRegister] = useState({ email: "", password: "", fullName: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("Welcome! Sign in or create an account to continue.");

  const onRegister = async (e) => {
    e.preventDefault();
    try {
      await api("user/auth/register", { method: "POST", body: register });
      setStatus("Registration successful. Redirecting...");
      router.replace("/");
    } catch (err) {
      setStatus(err.message);
    }
  };
  const onLogin = async (e) => {
    e.preventDefault();
    try {
      await api("user/auth/login", { method: "POST", body: login });
      setStatus("Login successful. Redirecting...");
      router.replace("/");
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <section className="auth-screen">
      <article className="auth-card">
        <div className="auth-brand">
          <h1>Sports Community</h1>
          <p className="muted">Find players, organize games, and manage teams and tournaments in one place.</p>
        </div>
        <div className="auth-forms">
          <div className="card">
            <h2>Register</h2>
            <form onSubmit={onRegister} className="row">
              <input placeholder="Full Name" value={register.fullName} onChange={(e) => setRegister({ ...register, fullName: e.target.value })} required />
              <input placeholder="Email" type="email" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} required />
              <input placeholder="Password" type="password" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} required />
              <button type="submit">Create Account</button>
            </form>
          </div>
          <div className="card">
            <h2>Login</h2>
            <form onSubmit={onLogin} className="row">
              <input placeholder="Email" type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} required />
              <input placeholder="Password" type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
        <p className="muted">{status}</p>
      </article>
    </section>
  );
}
