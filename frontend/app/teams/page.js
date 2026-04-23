"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function TeamsPage() {
  const [create, setCreate] = useState({ name: "", captainId: "" });
  const [join, setJoin] = useState({ inviteCode: "", userId: "" });
  const [team, setTeam] = useState(null);
  const [status, setStatus] = useState("");

  const createTeam = async (e) => {
    e.preventDefault();
    try { const t = await api("team/teams", { method: "POST", body: create }); setTeam(t); setStatus("Team created"); } catch (err) { setStatus(err.message); }
  };
  const joinTeam = async (e) => {
    e.preventDefault();
    try { await api("team/teams/join", { method: "POST", body: join }); setStatus("Joined team"); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="module-page">
      <div className="card">
        <h1>Team Management</h1>
        <p className="muted">Build squads, invite players, and maintain team structures.</p>
      </div>
      <div className="grid">
        <article className="card"><h2>Create Team</h2><form className="form-grid" onSubmit={createTeam}><input placeholder="Team Name" value={create.name} onChange={(e) => setCreate({ ...create, name: e.target.value })} required /><input placeholder="Captain User ID" value={create.captainId} onChange={(e) => setCreate({ ...create, captainId: e.target.value })} required /><button type="submit">Create</button></form></article>
        <article className="card"><h2>Join Team</h2><form className="stack" onSubmit={joinTeam}><input placeholder="Invite Code" value={join.inviteCode} onChange={(e) => setJoin({ ...join, inviteCode: e.target.value })} required /><input placeholder="User ID" value={join.userId} onChange={(e) => setJoin({ ...join, userId: e.target.value })} required /><button type="submit">Join</button></form></article>
      </div>
      <article className="card"><h2>Latest Team Result</h2>{team ? <pre className="muted">{JSON.stringify(team, null, 2)}</pre> : <p className="muted">Create a team to see details here.</p>}<p className="muted">{status}</p></article>
    </section>
  );
}
