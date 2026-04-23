"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const FORMATS = ["League", "Knockout", "Round Robin", "Swiss"];
const SPORTS  = ["Football", "Cricket", "Basketball", "Badminton", "Tennis", "Volleyball"];

export default function TournamentsPage() {
  const [userId, setUserId]   = useState(null);
  const [tab,     setTab]     = useState("list");
  const [list,    setList]    = useState([]);
  const [form,    setForm]    = useState({ name: "", sport: "", format: "", city: "" });
  const [teams,   setTeams]   = useState("");
  const [created, setCreated] = useState(null);
  const [table,   setTable]   = useState(null);
  const [status,  setStatus]  = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const load = async () => {
    try { setList(await api("tournament/tournaments")); }
    catch (e) { toast(e.message, true); }
  };

  useEffect(() => {
    load();
    api("user/users/me").then((me) => setUserId(me._id)).catch(() => {});
  }, []);

  const doRegister = async (tourId) => {
    try {
      await api(`tournament/tournaments/${tourId}/register`, {
        method: "POST",
        body: { userId }
      });
      toast("Registration request sent! Check your profile for status.");
    } catch (err) { toast(err.message, true); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const t = await api("tournament/tournaments", { method: "POST", body: { ...form, createdBy: userId } });
      setCreated(t);
      toast("Tournament created! Now generate fixtures.");
      setTab("fixtures");
    } catch (err) { toast(err.message, true); }
  };

  const genFixtures = async () => {
    if (!created?._id) { toast("Create a tournament first.", true); return; }
    const teamList = teams.split(",").map((x) => x.trim()).filter(Boolean);
    if (teamList.length < 2) { toast("Enter at least 2 team names.", true); return; }
    try {
      await api(`tournament/tournaments/${created._id}/fixtures/auto`, {
        method: "POST", body: { teams: teamList },
      });
      const t = await api(`tournament/tournaments/${created._id}/table`);
      setTable(t);
      toast(`${t.fixtures?.length || 0} fixtures generated!`);
    } catch (err) { toast(err.message, true); }
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">🏆 Tournament Hub</h1>
        <p className="page-subtitle">Launch competitions, auto-generate fixtures and track live standings.</p>
      </div>

      <div className="page-body">
        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["list", "create", "fixtures", "table"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ list: "📋 Browse", create: "🏆 Create", fixtures: "⚙️ Fixtures", table: "📊 Standings" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* LIST */}
        {tab === "list" && (
          <div className="fade-up-2">
            {list.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <p className="font-bold">No tournaments yet</p>
                <p className="text-muted text-sm mt-2">Be the first to organize a tournament!</p>
                <button className="btn btn-primary mt-4" onClick={() => setTab("create")}>
                  Create Tournament →
                </button>
              </div>
            ) : (
              <div className="item-grid">
                {list.map((t) => (
                  <div className="item-card" key={t._id}>
                    <div className="flex-between mb-4" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div className="item-card-title">{t.name}</div>
                        <div className="item-card-meta">
                          <span>📍 {t.city}</span>
                          <span>🏆 {t.format}</span>
                        </div>
                      </div>
                      <span className="badge badge-purple">{t.sport}</span>
                    </div>
                    <div className="item-card-footer">
                      <button className="btn btn-sm btn-outline" onClick={() => { setCreated(t); setTab("table"); }}>
                        Standings →
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={() => doRegister(t._id)}>
                        Register →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE */}
        {tab === "create" && (
          <div className="card fade-up-2" style={{ maxWidth: 640 }}>
            <div className="card-header">
              <span className="card-title">New Tournament</span>
              <div className="card-icon" style={{ background: "rgba(168,85,247,0.15)" }}>🏆</div>
            </div>
            <form className="form-stack" onSubmit={create}>
              <label>
                Tournament Name
                <input placeholder="e.g. Summer Cricket League 2025"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <div className="form-row">
                <label>
                  Sport
                  <select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} required>
                    <option value="">Select sport</option>
                    {SPORTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Format
                  <select value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} required>
                    <option value="">Select format</option>
                    {FORMATS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </label>
              </div>
              <label>
                City
                <input placeholder="e.g. Mumbai"
                  value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              </label>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                Create Tournament →
              </button>
            </form>
            {created && (
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.15)" }}>
                <p className="text-xs text-muted" style={{ marginBottom: 2 }}>CREATED</p>
                <p style={{ fontWeight: 700 }}>{created.name}</p>
                <p className="text-sm text-muted">{created.sport} · {created.format} · {created.city}</p>
              </div>
            )}
          </div>
        )}

        {/* FIXTURES */}
        {tab === "fixtures" && (
          <div className="card fade-up-2" style={{ maxWidth: 640 }}>
            <div className="card-header">
              <span className="card-title">Generate Fixtures</span>
              <div className="card-icon" style={{ background: "rgba(79,140,255,0.12)" }}>⚙️</div>
            </div>
            {!created ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p className="text-muted text-sm">Create a tournament first to generate fixtures.</p>
                <button className="btn btn-outline mt-4 btn-sm" onClick={() => setTab("create")}>
                  ← Go Create
                </button>
              </div>
            ) : (
              <div className="form-stack">
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(79,140,255,0.08)", border: "1px solid rgba(79,140,255,0.15)", marginBottom: 4 }}>
                  <p className="text-xs text-muted">TOURNAMENT</p>
                  <p style={{ fontWeight: 700, marginTop: 2 }}>{created.name}</p>
                </div>
                <label>
                  Team Names <span className="text-muted" style={{ textTransform: "none", fontWeight: 400 }}>(comma-separated)</span>
                  <input placeholder="Alpha FC, Beta United, Gamma XI, Delta SC"
                    value={teams} onChange={(e) => setTeams(e.target.value)} />
                </label>
                <button className="btn btn-primary" onClick={genFixtures}>
                  ⚙️ Auto-Generate Fixtures
                </button>
              </div>
            )}
          </div>
        )}

        {/* TABLE */}
        {tab === "table" && (
          <div className="card fade-up-2">
            <div className="card-header">
              <span className="card-title">Fixture Standings</span>
              <div className="card-icon" style={{ background: "rgba(251,191,36,0.12)" }}>📊</div>
            </div>
            {!table ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p className="text-muted text-sm">No fixtures generated yet.</p>
                <button className="btn btn-outline mt-4 btn-sm" onClick={() => setTab("fixtures")}>
                  Generate Fixtures →
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team A</th>
                      <th>Team B</th>
                      <th>Score</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(table.fixtures || []).map((f, i) => (
                      <tr key={f._id || i}>
                        <td className="text-muted text-sm">{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{f.teamA}</td>
                        <td style={{ fontWeight: 600 }}>{f.teamB}</td>
                        <td>{f.scoreA ?? 0} – {f.scoreB ?? 0}</td>
                        <td><span className="badge badge-amber">{f.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
