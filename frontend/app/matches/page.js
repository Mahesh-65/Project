"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState({ title: "", sport: "", location: "", totalSlots: "", startsAt: "" });
  const [join, setJoin] = useState({ matchId: "", userId: "" });
  const [status, setStatus] = useState("");

  const load = async () => {
    try { setMatches(await api("player/matches")); } catch (err) { setStatus(err.message); }
  };
  useEffect(() => { load(); }, []);

  const createMatch = async (e) => {
    e.preventDefault();
    try { await api("player/matches", { method: "POST", body: form }); setStatus("Match created"); await load(); } catch (err) { setStatus(err.message); }
  };

  const joinMatch = async (e) => {
    e.preventDefault();
    try { await api(`player/matches/${join.matchId}/join`, { method: "POST", body: { userId: join.userId } }); setStatus("Join request sent"); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="module-page">
      <div className="card">
        <h1>Match Center</h1>
        <p className="muted">Create games, join open slots, and track upcoming schedules.</p>
      </div>
      <div className="grid">
      <article className="card">
        <h2>Create Match</h2>
        <form onSubmit={createMatch} className="form-grid">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input placeholder="Sport" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} required />
          <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          <input type="number" placeholder="Total Slots" value={form.totalSlots} onChange={(e) => setForm({ ...form, totalSlots: Number(e.target.value) || "" })} required />
          <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
          <button type="submit">Create</button>
        </form>
      </article>

      <article className="card">
        <h2>Join Match</h2>
        <form onSubmit={joinMatch} className="stack">
          <input placeholder="Match ID" value={join.matchId} onChange={(e) => setJoin({ ...join, matchId: e.target.value })} required />
          <input placeholder="User ID" value={join.userId} onChange={(e) => setJoin({ ...join, userId: e.target.value })} required />
          <button type="submit">Join</button>
        </form>
      </article>
      </div>

      <article className="card">
        <h2>Upcoming Matches</h2>
        <div className="list-grid">
          {matches.map((m) => <div className="card" key={m._id}><h3>{m.title}</h3><p className="muted">{m.sport} | {m.location}</p><p className="muted">ID: {m._id}</p></div>)}
        </div>
        <p className="muted">{status}</p>
      </article>
    </section>
  );
}
