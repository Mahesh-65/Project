"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function TeamsPage() {
  const [tab,    setTab]    = useState("browse");
  const [create, setCreate] = useState({ name: "", captainId: "" });
  const [join,   setJoin]   = useState({ inviteCode: "", userId: "" });
  const [team,   setTeam]   = useState(null);
  const [list,   setList]   = useState([]);
  const [status, setStatus] = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const notify = async (userId, title, message, type = "info") => {
    try { await api("user/notifications", { method: "POST", body: { userId, title, message, type } }); }
    catch (e) { console.error("Notify failed", e); }
  };

  const load = async () => {
    try { setList(await api("team/teams")); }
    catch (e) { toast(e.message, true); }
  };

  useEffect(() => {
    load();
    api("user/users/me").then((me) => {
      setCreate(c => ({ ...c, captainId: me._id }));
      setJoin(j => ({ ...j, userId: me._id }));
    }).catch(() => {});
  }, []);

  const createTeam = async (e) => {
    e.preventDefault();
    try {
      const t = await api("team/teams", { method: "POST", body: create });
      setTeam(t);
      toast("Team created! Share the invite code with your squad.");
      load();
    } catch (err) { toast(err.message, true); }
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await api("team/teams/join", { method: "POST", body: join });
      toast("Join request sent! Captain needs to approve.");
      setJoin({ inviteCode: "", userId: "" });
      // Get team info to notify captain
      const team = await api(`team/teams/${res.teamId}`);
      if (team.captainId && team.captainId !== join.userId) {
        await notify(team.captainId, "New Team Request", `Someone requested to join team ${team.name}.`, "info");
      }
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
          {["browse", "create", "join"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ browse: "📋 Browse Teams", create: "➕ Create Team", join: "🔗 Join Team" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: tab === "browse" ? "1fr" : "1fr 1fr", maxWidth: 900 }}>
          {/* LIST */}
          {tab === "browse" && (
            <div className="fade-up-2">
              {list.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🛡️</div>
                  <p className="font-bold">No teams yet</p>
                  <p className="text-muted text-sm mt-2">Create your own team and start recruiting!</p>
                  <button className="btn btn-primary mt-4" onClick={() => setTab("create")}>
                    Create Team →
                  </button>
                </div>
              ) : (
                <div className="item-grid">
                  {list.map((t) => (
                    <div className="item-card" key={t._id}>
                      <div className="flex-between mb-4">
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(168,85,247,0.12)",
                            display: "grid", placeItems: "center", fontSize: 22
                          }}>🛡️</div>
                          <div>
                            <div className="item-card-title">{t.name}</div>
                            <div className="text-muted text-xs">{t.members?.length || 0} Members</div>
                          </div>
                        </div>
                        <span className="badge badge-purple">{t.wins}W - {t.losses}L</span>
                      </div>
                      <div className="item-card-footer">
                        <button className="btn btn-sm btn-outline" onClick={() => {
                          setJoin({ ...join, inviteCode: t.inviteCode });
                          setTab("join");
                        }}>Join Team →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FORM */}
          {tab === "create" && (
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
                  <input placeholder="Your user ID" value={create.captainId}
                    onChange={(e) => setCreate({ ...create, captainId: e.target.value })} required />
                </label>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                  Create Team →
                </button>
              </form>
            </div>
          )}

          {tab === "join" && (
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
                  <input placeholder="Your user ID" value={join.userId}
                    onChange={(e) => setJoin({ ...join, userId: e.target.value })} required />
                </label>
                <button type="submit" className="btn btn-green" style={{ marginTop: 4 }}>
                  Join Team →
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
                <div className="divider" />
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
                <p className="text-muted text-sm">Share the invite code with players you want to recruit.</p>
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
