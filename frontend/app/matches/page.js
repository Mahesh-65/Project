"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const SPORTS = ["Football", "Cricket", "Basketball", "Badminton", "Tennis", "Volleyball"];

export default function MatchesPage() {
  const [userId, setUserId]   = useState(null);
  const [matches, setMatches] = useState([]);
  const [form, setForm]       = useState({ title: "", sport: "", location: "", totalSlots: "", startsAt: "" });
  const [joinId, setJoinId]   = useState("");
  const [status, setStatus]   = useState({ msg: "", err: false });
  const [tab, setTab]         = useState("list");

  const toast = (msg, err = false) => setStatus({ msg, err });

  const load = async () => {
    try { setMatches(await api("player/matches")); }
    catch (e) { toast(e.message, true); }
  };

  useEffect(() => {
    load();
    api("user/users/me").then((me) => setUserId(me._id)).catch(() => {});
  }, []);

  const createMatch = async (e) => {
    e.preventDefault();
    try {
      await api("player/matches", { method: "POST", body: { ...form, totalSlots: Number(form.totalSlots), createdBy: userId } });
      toast("Match created successfully!");
      setForm({ title: "", sport: "", location: "", totalSlots: "", startsAt: "" });
      setTab("list");
      load();
    } catch (e) { toast(e.message, true); }
  };

  const doJoin = async (mId, creatorId) => {
    try {
      await api(`player/matches/${mId}/join`, { method: "POST", body: { userId } });
      toast("Join request sent!");
      if (creatorId) {
        api("user/notifications", {
          method: "POST",
          body: {
            userId: creatorId,
            title: "New Match Request",
            message: `Someone wants to join your match. Check your Hub.`,
            type: "info"
          }
        }).catch(() => {});
      }
    } catch (e) { toast(e.message, true); }
  };

  const joinById = async () => {
    if (!joinId.trim()) return;
    const match = matches.find(m => m._id === joinId);
    doJoin(joinId, match?.createdBy);
    setJoinId("");
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">⚽ Match Center</h1>
        <p className="page-subtitle">Create games, discover open slots and track upcoming schedules.</p>
      </div>

      <div className="page-body">
        {/* TAB BAR */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["list", "create", "join"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ list: "📋 Matches", create: "➕ Create", join: "🔗 Join by ID" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* LIST */}
        {tab === "list" && (
          <div className="fade-up-2">
            {matches.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <p className="font-bold">No matches yet</p>
                <p className="text-muted text-sm mt-2">Be the first to create a match!</p>
                <button className="btn btn-primary mt-4" onClick={() => setTab("create")}>
                  Create Match →
                </button>
              </div>
            ) : (
              <div className="item-grid">
                {matches.map((m) => (
                  <div className="item-card" key={m._id}>
                    <div className="flex-between mb-4" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div className="item-card-title">{m.title}</div>
                        <div className="item-card-meta">
                          <span>📍 {m.location}</span>
                          <span>🗓 {m.startsAt ? new Date(m.startsAt).toLocaleString() : "TBD"}</span>
                        </div>
                      </div>
                      <span className="badge badge-blue">{m.sport}</span>
                    </div>
                    <div className="item-card-footer">
                      <span className="text-muted text-xs">
                        {m.totalSlots} slots
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => doJoin(m._id, m.createdBy)}
                        disabled={m.createdBy === userId}
                      >
                        {m.createdBy === userId ? "My Match" : "Join →"}
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
              <span className="card-title">New Match</span>
              <div className="card-icon" style={{ background: "rgba(79,140,255,0.15)" }}>⚽</div>
            </div>
            <form className="form-stack" onSubmit={createMatch}>
              <label>
                Match Title
                <input placeholder="e.g. Sunday 5-a-side" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
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
                  Total Slots
                  <input type="number" placeholder="10" min="2" value={form.totalSlots}
                    onChange={(e) => setForm({ ...form, totalSlots: e.target.value })} required />
                </label>
              </div>
              <label>
                Location
                <input placeholder="Ground name or address" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </label>
              <label>
                Date & Time
                <input type="datetime-local" value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
              </label>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                Create Match →
              </button>
            </form>
          </div>
        )}

        {/* JOIN BY ID */}
        {tab === "join" && (
          <div className="card fade-up-2" style={{ maxWidth: 480 }}>
            <div className="card-header">
              <span className="card-title">Join a Match</span>
              <div className="card-icon" style={{ background: "rgba(0,229,160,0.12)" }}>🔗</div>
            </div>
            <div className="form-stack">
              <label>
                Match ID
                <input placeholder="Paste match ID here" value={joinId}
                  onChange={(e) => setJoinId(e.target.value)} />
              </label>
              <button className="btn btn-green" onClick={joinById}>Send Join Request →</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
