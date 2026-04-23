"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function TeamsPage() {
  const [userId, setUserId]  = useState(null);
  const [tab,    setTab]    = useState("create");
  const [create, setCreate] = useState({ name: "", captainId: "" });
  const [join,   setJoin]   = useState({ inviteCode: "", userId: "" });
  const [team,   setTeam]   = useState(null);
  const [status, setStatus] = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  useEffect(() => {
    api("user/users/me").then((me) => {
      setUserId(me._id);
      setCreate(p => ({ ...p, captainId: me._id }));
      setJoin(p => ({ ...p, userId: me._id }));
    }).catch(() => {});
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      const t = await api("team/teams", { method: "POST", body: create });
      setTeam(t);
      toast("Team created! Share the invite code with your squad.");
    } catch (err) { toast(err.message, true); }
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await api("team/teams/join", { method: "POST", body: join });
      toast(res.message || "Successfully sent join request!");
      setJoin({ inviteCode: "", userId: userId });
      
      // Notify captain (optional enhancement: we'd need team owner ID here)
    } catch (err) { toast(err.message, true); }
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">🛡️ Team Management</h1>
        <p className="page-subtitle">Build squads, manage captains, and invite players to compete.</p>
      </div>

      <div className="page-body">
        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["create", "join"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ create: "➕ Create Team", join: "🔗 Join Team" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr", maxWidth: 900 }}>
          {/* FORM */}
          {tab === "create" ? (
            <div className="card fade-up-2">
              <div className="card-header">
                <span className="card-title">Create New Team</span>
                <div className="card-icon" style={{ background: "rgba(0,229,160,0.12)" }}>🛡️</div>
              </div>
              <form className="form-stack" onSubmit={createTeam}>
                <label>
                  Team Name
                  <input placeholder="e.g. Thunder Hawks FC" value={create.name}
                    onChange={(e) => setCreate({ ...create, name: e.target.value })} required />
                </label>
                <label>
                  Captain User ID
                  <input placeholder="Your user ID" value={create.captainId} disabled />
                </label>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                  Create Team →
                </button>
              </form>
            </div>
          ) : (
            <div className="card fade-up-2">
              <div className="card-header">
                <span className="card-title">Join a Team</span>
                <div className="card-icon" style={{ background: "rgba(168,85,247,0.12)" }}>🔗</div>
              </div>
              <form className="form-stack" onSubmit={joinTeam}>
                <label>
                  Invite Code
                  <input placeholder="e.g. ABC123" value={join.inviteCode}
                    onChange={(e) => setJoin({ ...join, inviteCode: e.target.value })} required />
                </label>
                <label>
                  Your User ID
                  <input placeholder="Your user ID" value={join.userId} disabled />
                </label>
                <button type="submit" className="btn btn-green" style={{ marginTop: 4 }}>
                  Send Join Request →
                </button>
              </form>
            </div>
          )}

          {/* TEAM RESULT */}
          <div className="card fade-up-3">
            <div className="card-header">
              <span className="card-title">Team Details</span>
              <div className="card-icon" style={{ background: "rgba(251,191,36,0.12)" }}>📋</div>
            </div>
            {team ? (
              <div className="form-stack">
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
                    display: "grid", placeItems: "center",
                    fontSize: 26, flexShrink: 0
                  }}>🛡️</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{team.name}</div>
                    <span className="badge badge-green" style={{ marginTop: 4 }}>Active</span>
                  </div>
                </div>
                <div className="divider" style={{ margin: "16px 0", borderBottom: "1px solid var(--border)" }} />
                {team.inviteCode && (
                  <div style={{
                    background: "rgba(0,229,160,0.06)",
                    border: "1px solid rgba(0,229,160,0.15)",
                    borderRadius: 10, padding: "12px 14px"
                  }}>
                    <div className="text-xs text-muted" style={{ marginBottom: 4 }}>INVITE CODE</div>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "var(--accent-2)" }}>
                      {team.inviteCode}
                    </div>
                  </div>
                )}
                <p className="text-muted text-sm" style={{ marginTop: 10 }}>Share the invite code with players you want to recruit. Requests will appear in your Hub.</p>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛡️</div>
                <p className="text-muted text-sm">Create or join a team to see details here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
