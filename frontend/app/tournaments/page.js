"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function TournamentsPage() {
  const [tour, setTour] = useState({ name: "", sport: "", format: "", city: "" });
  const [teams, setTeams] = useState("");
  const [created, setCreated] = useState(null);
  const [table, setTable] = useState(null);
  const [status, setStatus] = useState("");

  const create = async (e) => {
    e.preventDefault();
    try { const t = await api("tournament/tournaments", { method: "POST", body: tour }); setCreated(t); setStatus("Tournament created"); } catch (err) { setStatus(err.message); }
  };
  const fixtures = async () => {
    if (!created?._id) return;
    try { await api(`tournament/tournaments/${created._id}/fixtures/auto`, { method: "POST", body: { teams: teams.split(",").map((x) => x.trim()).filter(Boolean) } }); setStatus("Fixtures generated"); setTable(await api(`tournament/tournaments/${created._id}/table`)); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="module-page">
      <div className="card">
        <h1>Tournament Hub</h1>
        <p className="muted">Launch competitions and auto-generate match fixtures.</p>
      </div>
      <div className="grid">
        <article className="card"><h2>Create Tournament</h2><form className="form-grid" onSubmit={create}><input placeholder="Tournament Name" value={tour.name} onChange={(e)=>setTour({...tour,name:e.target.value})} required/><input placeholder="Sport" value={tour.sport} onChange={(e)=>setTour({...tour,sport:e.target.value})} required/><input placeholder="Format (League / Knockout)" value={tour.format} onChange={(e)=>setTour({...tour,format:e.target.value})} required/><input placeholder="City" value={tour.city} onChange={(e)=>setTour({...tour,city:e.target.value})} required/><button type="submit">Create</button></form></article>
        <article className="card"><h2>Generate Fixtures</h2><div className="stack"><input placeholder="Comma-separated team names" value={teams} onChange={(e)=>setTeams(e.target.value)}/><button onClick={fixtures}>Generate</button></div>{table ? <pre className="muted">{JSON.stringify(table, null, 2)}</pre> : null}<p className="muted">{status}</p></article>
      </div>
    </section>
  );
}
