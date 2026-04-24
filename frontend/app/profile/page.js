"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const STATUS_BADGE = {
  joined:    "badge-green",
  waiting:   "badge-amber",
  rejected:  "badge-red",
  approved:  "badge-green",
  pending:   "badge-amber",
  created:   "badge-blue",
  shipped:   "badge-purple",
  delivered: "badge-green",
  member:    "badge-blue",
  captain:   "badge-purple",
};

function Badge({ label }) {
  const cls = STATUS_BADGE[label?.toLowerCase()] || "badge-blue";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function EmptyState({ icon, text, action, actionLabel }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <p className="text-muted text-sm">{text}</p>
      {action && (
        <a href={action} className="btn btn-sm btn-outline" style={{ display: "inline-flex", marginTop: 12 }}>
          {actionLabel} →
        </a>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview",      label: "Overview",        icon: "👤" },
  { id: "notifications", label: "Notifications",   icon: "🔔" },
  { id: "my-matches",    label: "My Matches",       icon: "⚽" },
  { id: "my-teams",      label: "My Teams",         icon: "🛡️" },
  { id: "my-tournaments",label: "My Tournaments",   icon: "🏆" },
  { id: "my-bookings",   label: "My Bookings",      icon: "📍" },
  { id: "my-lfp",        label: "My LFP Requests",  icon: "📣" },
  { id: "my-orders",     label: "My Orders",        icon: "🛒" },
];

export default function ProfilePage() {
  const [user,          setUser]          = useState(null);
  const [tab,           setTab]           = useState("overview");
  const [myMatches,     setMyMatches]     = useState([]);
  const [joinedMatches, setJoinedMatches] = useState([]);
  const [myTeams,       setMyTeams]       = useState([]);
  const [joinedTeams,   setJoinedTeams]   = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [joinedTours,   setJoinedTours]   = useState([]);
  const [myBookings,    setMyBookings]    = useState([]);
  const [myOrders,      setMyOrders]      = useState([]);
  const [myLFP,         setMyLFP]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [requests,      setRequests]      = useState({}); // matchId -> requests[]
  const [tourRegs,      setTourRegs]      = useState({}); // tournamentId -> regs[]
  const [loading,       setLoading]       = useState(true);
  const [status,        setStatus]        = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const notify = async (userId, title, message, type = "info") => {
    try { await api("user/notifications", { method: "POST", body: { userId, title, message, type } }); }
    catch (e) { console.error("Notify failed", e); }
  };

  useEffect(() => {
    api("user/users/me")
      .then(setUser)
      .catch(() => (window.location.href = "/auth"));

    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t && TABS.some(x => x.id === t)) setTab(t);
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    const id = user._id;
    setLoading(true);
    Promise.all([
      api(`player/matches/mine?userId=${id}`).then(setMyMatches).catch(() => {}),
      api(`player/matches/joined?userId=${id}`).then(setJoinedMatches).catch(() => {}),
      api(`team/teams/mine?userId=${id}`).then(setMyTeams).catch(() => {}),
      api(`team/teams/joined?userId=${id}`).then(setJoinedTeams).catch(() => {}),
      api(`tournament/tournaments/mine?userId=${id}`).then(setMyTournaments).catch(() => {}),
      api(`tournament/tournaments/joined?userId=${id}`).then(setJoinedTours).catch(() => {}),
      api(`ground/bookings/mine?userId=${id}`).then(setMyBookings).catch(() => {}),
      api(`shop/orders/mine?userId=${id}`).then(setMyOrders).catch(() => {}),
      api(`player/lfp`).then(data => setMyLFP(data.filter(x => x.createdBy === id))).catch(() => {}),
      api(`user/notifications`).then(setNotifications).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  // Load join requests for a match
  const loadRequests = async (matchId) => {
    if (requests[matchId]) return;
    try {
      const rows = await api(`player/matches/${matchId}/requests`);
      setRequests((p) => ({ ...p, [matchId]: rows }));
    } catch (e) { toast(e.message, true); }
  };

  // Load registrations for a tournament
  const loadTourRegs = async (tourId) => {
    if (tourRegs[tourId]) return;
    try {
      const rows = await api(`tournament/tournaments/${tourId}/registrations`);
      setTourRegs((p) => ({ ...p, [tourId]: rows }));
    } catch (e) { toast(e.message, true); }
  };

  const approveMatchReq = async (matchId, userId, action) => {
    try {
      await api(`player/matches/${matchId}/requests/${userId}`, { method: "PATCH", body: { action } });
      toast(`Request ${action}d!`);
      const rows = await api(`player/matches/${matchId}/requests`);
      setRequests((p) => ({ ...p, [matchId]: rows }));
      await notify(userId, `Match Update`, `Your request to join match ${matchId.slice(-4)} was ${action}d.`, action === "approve" ? "success" : "warning");
    } catch (e) { toast(e.message, true); }
  };

  const approveTourReg = async (tourId, userId, action) => {
    try {
      await api(`tournament/tournaments/${tourId}/registrations/${userId}`, { method: "PATCH", body: { action } });
      toast(`Registration ${action}d!`);
      const rows = await api(`tournament/tournaments/${tourId}/registrations`);
      setTourRegs((p) => ({ ...p, [tourId]: rows }));
      await notify(userId, `Tournament Update`, `Your registration for tournament ${tourId.slice(-4)} was ${action}d.`, action === "approve" ? "success" : "warning");
    } catch (e) { toast(e.message, true); }
  };

  const approveTeamReq = async (teamId, userId, action) => {
    try {
      await api(`team/teams/${teamId}/members/${userId}`, { method: "PATCH", body: { action } });
      toast(`Member ${action}d!`);
      const updatedTeams = await api(`team/teams/mine?userId=${user._id}`);
      setMyTeams(updatedTeams);
      await notify(userId, `Team Update`, `Your request to join team ${teamId.slice(-4)} was ${action}d.`, action === "approve" ? "success" : "warning");
    } catch (e) { toast(e.message, true); }
  };

  const fillLFP = async (id) => {
    try {
      await api(`player/lfp/${id}/fill`, { method: "PATCH" });
      toast("Request marked as filled.");
      setMyLFP(p => p.map(x => x._id === id ? { ...x, status: "filled" } : x));
    } catch (e) { toast(e.message, true); }
  };

  if (!user || loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">Loading your profile…</p>
      </div>
    );
  }

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const totalActivity =
    myMatches.length + joinedMatches.length + myTeams.length +
    joinedTeams.length + myOrders.length + myBookings.length;

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">All your activity, creations and history in one place.</p>
      </div>

      <div className="page-body">
        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* PROFILE HERO */}
        <div className="card card-accent mb-6 fade-up-2" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
            display: "grid", placeItems: "center",
            fontSize: 28, fontWeight: 800, color: "#fff",
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{user.fullName}</div>
            <div className="text-muted text-sm">{user.email}</div>
            <div className="flex gap-2 mt-2" style={{ flexWrap: "wrap" }}>
              <Badge label={user.role || "member"} />
              {user.city && <span className="badge badge-blue">📍 {user.city}</span>}
              {user.skillLevel && <span className="badge badge-green">{user.skillLevel}</span>}
              {user.preferredSports?.map((s) => <span key={s} className="badge badge-purple">{s}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>{totalActivity}</div>
            <div className="text-muted text-xs">Total Activities</div>
            <a href="/profile/edit" className="btn btn-sm btn-outline" style={{ marginTop: 6 }}>Edit Profile →</a>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="stat-grid fade-up-3" style={{ marginBottom: 28 }}>
          {[
            { icon: "⚽", label: "Matches Created",  value: myMatches.length,     color: "rgba(79,140,255,0.15)" },
            { icon: "🤝", label: "Matches Joined",   value: joinedMatches.length,  color: "rgba(0,229,160,0.12)" },
            { icon: "🛡️", label: "Teams Captained",  value: myTeams.length,        color: "rgba(168,85,247,0.12)"},
            { icon: "🏆", label: "Tournaments",       value: myTournaments.length + joinedTours.length, color: "rgba(251,191,36,0.12)" },
            { icon: "📍", label: "Bookings Made",     value: myBookings.length,     color: "rgba(255,77,109,0.12)" },
            { icon: "🛒", label: "Orders Placed",     value: myOrders.length,       color: "rgba(79,140,255,0.12)" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon-wrap" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TAB BAR */}
        <div className="flex gap-2 mb-6 fade-up-4" style={{ flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div className="fade-up-2">
            <div className="flex-between mb-4">
              <p className="section-title">Your Notifications ({notifications.length})</p>
              {notifications.length > 0 && (
                <button className="btn btn-sm btn-outline" onClick={async () => {
                  await api("user/notifications/read-all", { method: "PATCH" });
                  setNotifications(notifications.map(n => ({ ...n, read: true })));
                }}>Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <EmptyState icon="🔔" text="All caught up! No new notifications." />
            ) : (
              <div className="form-stack">
                {notifications.map((n) => (
                  <div key={n._id} className="card" style={{
                    padding: "16px", borderLeft: n.read ? "1px solid var(--border)" : "4px solid var(--accent)",
                    background: n.read ? "transparent" : "rgba(79,140,255,0.05)"
                  }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: 800, fontSize: 14, color: n.read ? "var(--muted-2)" : "var(--text)" }}>{n.title}</span>
                      <span className="text-muted text-xs">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: n.read ? "var(--muted-2)" : "var(--muted-1)" }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            {/* Bio */}
            <div className="card">
              <div className="card-header"><span className="card-title">About</span></div>
              <p className="text-muted text-sm" style={{ lineHeight: 1.8 }}>
                {user.bio || "No bio added yet. Edit your profile to add one."}
              </p>
              {user.availability?.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-muted" style={{ marginBottom: 6 }}>AVAILABILITY</div>
                  <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                    {user.availability.map((a) => <span key={a} className="badge badge-blue">{a}</span>)}
                  </div>
                </div>
              )}
            </div>
            {/* Recent activity */}
            <div className="card">
              <div className="card-header"><span className="card-title">Recent Activity</span></div>
              <div className="form-stack">
                {myMatches.slice(0, 2).map((m) => (
                  <div key={m._id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>⚽</span>
                    <div>
                      <div className="text-sm font-bold">{m.title}</div>
                      <div className="text-muted text-xs">Created match · {m.location}</div>
                    </div>
                  </div>
                ))}
                {joinedMatches.slice(0, 2).map((m) => (
                  <div key={m._id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 20 }}>🤝</span>
                    <div>
                      <div className="text-sm font-bold">{m.title}</div>
                      <div className="text-muted text-xs">Joined match · <Badge label={m.joinStatus} /></div>
                    </div>
                  </div>
                ))}
                {totalActivity === 0 && <EmptyState icon="🌱" text="No activity yet. Start by joining a match!" action="/matches" actionLabel="Browse Matches" />}
              </div>
            </div>
          </div>
        )}

        {/* ── MY MATCHES ── */}
        {tab === "my-matches" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Created */}
            <div>
              <p className="section-title">Matches I Created ({myMatches.length})</p>
              {myMatches.length === 0
                ? <EmptyState icon="⚽" text="You haven't created any matches yet." action="/matches" actionLabel="Create Match" />
                : myMatches.map((m) => (
                  <div className="card mb-4" key={m._id}>
                    <div className="flex-between" style={{ flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{m.title}</div>
                        <div className="text-muted text-sm">📍 {m.location} · {m.sport} · {m.totalSlots} slots</div>
                        {m.startsAt && <div className="text-muted text-xs">🗓 {new Date(m.startsAt).toLocaleString()}</div>}
                      </div>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => loadRequests(m._id)}
                      >View Join Requests</button>
                    </div>

                    {/* JOIN REQUESTS */}
                    {requests[m._id] && (
                      <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <div className="text-xs text-muted" style={{ marginBottom: 8 }}>
                          JOIN REQUESTS ({requests[m._id].length})
                        </div>
                        {requests[m._id].length === 0
                          ? <p className="text-muted text-sm">No requests yet.</p>
                          : requests[m._id].map((r) => (
                            <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                              <div>
                                <span className="text-sm font-bold">User: {r.userId?.slice(-8)}</span>
                                <Badge label={r.status} />
                              </div>
                              {r.status === "waiting" && (
                                <div className="flex gap-2">
                                  <button className="btn btn-sm btn-green" onClick={() => approveMatchReq(m._id, r.userId, "approve")}>Approve</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => approveMatchReq(m._id, r.userId, "reject")}>Reject</button>
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))
              }
            </div>

            {/* Joined */}
            <div>
              <p className="section-title">Matches I Joined ({joinedMatches.length})</p>
              {joinedMatches.length === 0
                ? <EmptyState icon="🤝" text="You haven't joined any matches yet." action="/matches" actionLabel="Browse Matches" />
                : (
                  <div className="item-grid">
                    {joinedMatches.map((m) => (
                      <div className="item-card" key={m._id}>
                        <div className="item-card-title">{m.title}</div>
                        <div className="item-card-meta">
                          <span>📍 {m.location}</span>
                          <span>🎮 {m.sport}</span>
                        </div>
                        <div className="item-card-footer">
                          <Badge label={m.joinStatus} />
                          <span className="text-muted text-xs">{m.totalSlots} slots</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ── MY TEAMS ── */}
        {tab === "my-teams" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p className="section-title">Teams I Captain ({myTeams.length})</p>
              {myTeams.length === 0
                ? <EmptyState icon="🛡️" text="You haven't created any teams yet." action="/teams" actionLabel="Create Team" />
                : myTeams.map((t) => (
                  <div className="card mb-4" key={t._id}>
                    <div className="flex-between" style={{ gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                        <div className="text-muted text-sm">{t.members?.length || 0} members · {t.wins}W {t.losses}L</div>
                      </div>
                      <div style={{
                        padding: "10px 16px", borderRadius: 10,
                        background: "rgba(0,229,160,0.07)", border: "1px solid rgba(0,229,160,0.15)"
                      }}>
                        <div className="text-xs text-muted">INVITE CODE</div>
                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, color: "var(--accent-2)" }}>{t.inviteCode}</div>
                      </div>
                    </div>
                    {t.members?.length > 0 && (
                      <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <div className="text-xs text-muted mb-3">MEMBERS & REQUESTS</div>
                        {t.members.map((m) => (
                          <div key={m.userId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                            <div className="flex gap-3" style={{ alignItems: "center" }}>
                              <span className="text-sm font-bold">…{m.userId?.slice(-10)}</span>
                              <Badge label={m.role} />
                            </div>
                            {m.role === "pending" && (
                              <div className="flex gap-2">
                                <button className="btn btn-sm btn-green" onClick={() => approveTeamReq(t._id, m.userId, "approve")}>Approve</button>
                                <button className="btn btn-sm btn-danger" onClick={() => approveTeamReq(t._id, m.userId, "reject")}>Reject</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
            <div>
              <p className="section-title">Teams I'm Part Of ({joinedTeams.filter((t) => t.captainId !== user._id && t.members.some(m => m.userId === user._id && m.role === "member")).length})</p>
              {joinedTeams.filter((t) => t.captainId !== user._id && t.members.some(m => m.userId === user._id && m.role === "member")).length === 0
                ? <EmptyState icon="🤝" text="You haven't joined any teams yet." action="/teams" actionLabel="Join a Team" />
                : (
                  <div className="item-grid">
                    {joinedTeams.filter((t) => t.captainId !== user._id && t.members.some(m => m.userId === user._id && m.role === "member")).map((t) => (
                      <div className="item-card" key={t._id}>
                        <div className="item-card-title">{t.name}</div>
                        <div className="item-card-meta">
                          <span>{t.members?.length || 0} members</span>
                          <span>{t.wins}W {t.losses}L</span>
                        </div>
                        <div className="item-card-footer">
                          <Badge label="member" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ── MY TOURNAMENTS ── */}
        {tab === "my-tournaments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p className="section-title">Tournaments I Organized ({myTournaments.length})</p>
              {myTournaments.length === 0
                ? <EmptyState icon="🏆" text="You haven't organized any tournaments yet." action="/tournaments" actionLabel="Create Tournament" />
                : myTournaments.map((t) => (
                  <div className="card mb-4" key={t._id}>
                    <div className="flex-between" style={{ flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{t.name}</div>
                        <div className="text-muted text-sm">{t.sport} · {t.format} · {t.city}</div>
                      </div>
                      <button className="btn btn-sm btn-outline" onClick={() => loadTourRegs(t._id)}>
                        View Registrations
                      </button>
                    </div>
                    {tourRegs[t._id] && (
                      <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                        <div className="text-xs text-muted mb-3">REGISTRATIONS ({tourRegs[t._id].length})</div>
                        {tourRegs[t._id].length === 0
                          ? <p className="text-muted text-sm">No registrations yet.</p>
                          : tourRegs[t._id].map((r) => (
                            <div key={r._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                              <div>
                                <span className="text-sm font-bold">User: {r.userId?.slice(-8)}</span>
                                {" "}<Badge label={r.status} />
                              </div>
                              {r.status === "pending" && (
                                <div className="flex gap-2">
                                  <button className="btn btn-sm btn-green" onClick={() => approveTourReg(t._id, r.userId, "approve")}>Approve</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => approveTourReg(t._id, r.userId, "reject")}>Reject</button>
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
            <div>
              <p className="section-title">Tournaments I Registered For ({joinedTours.length})</p>
              {joinedTours.length === 0
                ? <EmptyState icon="🎯" text="You haven't registered for any tournaments." action="/tournaments" actionLabel="Browse Tournaments" />
                : (
                  <div className="item-grid">
                    {joinedTours.map((t) => (
                      <div className="item-card" key={t._id}>
                        <div className="item-card-title">{t.name}</div>
                        <div className="item-card-meta">
                          <span>{t.sport} · {t.format}</span>
                          <span>📍 {t.city}</span>
                        </div>
                        <div className="item-card-footer"><Badge label={t.regStatus} /></div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {tab === "my-bookings" && (
          <div>
            <p className="section-title">My Ground Bookings ({myBookings.length})</p>
            {myBookings.length === 0
              ? <EmptyState icon="📍" text="No bookings made yet." action="/grounds" actionLabel="Find Grounds" />
              : (
                <div className="item-grid">
                  {myBookings.map((b) => (
                    <div className="item-card" key={b._id}>
                      <div className="item-card-title">{b.ground?.name || "Ground Booking"}</div>
                      <div className="item-card-meta">
                        {b.ground && <span>📍 {b.ground.area}, {b.ground.city}</span>}
                        <span>🗓 {b.date || "Date TBD"}</span>
                        {b.slots && <span>⏰ {b.slots}</span>}
                      </div>
                      <div className="item-card-footer">
                        <Badge label={b.status || "pending"} />
                        <Badge label={b.paymentStatus || "pending"} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── MY ORDERS ── */}
        {tab === "my-orders" && (
          <div>
            <p className="section-title">My Orders ({myOrders.length})</p>
            {myOrders.length === 0
              ? <EmptyState icon="🛒" text="No orders placed yet." action="/shop" actionLabel="Browse Shop" />
              : myOrders.map((o) => (
                <div className="card mb-4" key={o._id}>
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{o.invoiceNumber}</div>
                      <div className="text-muted text-xs">{o.trackingId}</div>
                      <div className="text-muted text-sm mt-1">{o.items?.length || 0} item(s) · ₹{o.total?.toLocaleString()}</div>
                    </div>
                    <Badge label={o.status} />
                  </div>
                  {o.items?.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      {o.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                          <span className="text-sm">{item.name || item.productId}</span>
                          <span className="text-muted text-sm">×{item.qty || 1} · ₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ── MY LFP ── */}
        {tab === "my-lfp" && (
          <div>
            <p className="section-title">My Last-Minute Requests ({myLFP.length})</p>
            {myLFP.length === 0
              ? <EmptyState icon="📣" text="No LFP requests posted." action="/lfp" actionLabel="Post LFP" />
              : (
                <div className="item-grid">
                  {myLFP.map((item) => (
                    <div className="item-card" key={item._id}>
                      <div className="flex-between mb-2">
                        <span className={`badge ${item.status === 'active' ? 'badge-red' : 'badge-green'}`}>
                          {item.status.toUpperCase()}
                        </span>
                        <span className="text-muted text-xs">{item.startsIn}</span>
                      </div>
                      <div className="item-card-title">{item.title}</div>
                      <div className="item-card-meta">
                        <span>🎮 {item.sport}</span>
                        <span>📍 {item.location}</span>
                      </div>
                      {item.status === "active" && (
                        <div className="item-card-footer mt-4">
                          <button className="btn btn-sm btn-outline btn-full" onClick={() => fillLFP(item._id)}>
                            Mark as Filled ✓
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}
      </div>
    </>
  );
}
