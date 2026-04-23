"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function AuthPage() {
  const [register, setRegister] = useState({ email: "", password: "", fullName: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("");

  const onRegister = async (e) => {
    e.preventDefault();
    try { await api("user/auth/register", { method: "POST", body: register }); setStatus("Registered successfully"); } catch (err) { setStatus(err.message); }
  };
  const onLogin = async (e) => {
    e.preventDefault();
    try { await api("user/auth/login", { method: "POST", body: login }); setStatus("Login successful"); } catch (err) { setStatus(err.message); }
  };
  const onMe = async () => {
    try { const data = await api("user/users/me"); setMe(data); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="grid">
      <article className="card">
        <h2>Register</h2>
        <form onSubmit={onRegister} className="row">
          <input placeholder="Full Name" value={register.fullName} onChange={(e) => setRegister({ ...register, fullName: e.target.value })} required />
          <input placeholder="Email" type="email" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} required />
          <input placeholder="Password" type="password" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} required />
          <button type="submit">Create Account</button>
        </form>
      </article>

      <article className="card">
        <h2>Login</h2>
        <form onSubmit={onLogin} className="row">
          <input placeholder="Email" type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} required />
          <input placeholder="Password" type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
          <button type="submit">Login</button>
        </form>
        <button onClick={onMe}>Load My Profile</button>
        {me ? <pre className="muted">{JSON.stringify(me, null, 2)}</pre> : null}
        <p className="muted">{status}</p>
      </article>
    </section>
  );
}
