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
  { id: "my-matches",    label: "My Matches",       icon: "⚽" },
  { id: "my-teams",      label: "My Teams",         icon: "🛡️" },
  { id: "my-tournaments",label: "My Tournaments",   icon: "🏆" },
  { id: "my-bookings",   label: "My Bookings",      icon: "📍" },
  { id: "my-orders",     label: "My Orders",        icon: "🛒" },
];

export default function ProfilePage() {
  const [user,          setUser]          = useState(null);
  const [tab,           setTab]           = useState("overview");
  const [myMatches,     setMyMatches]     = useState([]);
  const [joinedMatches, setJoinedMatches] = useState([]);
  const [myTeams,       setMyTeams]       = useState([]);
  const [teamRequests,  setTeamRequests]  = useState([]); // join requests I sent
  const [joinedTeams,   setJoinedTeams]   = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [joinedTours,   setJoinedTours]   = useState([]);
  const [myBookings,    setMyBookings]    = useState([]);
  const [myOrders,      setMyOrders]      = useState([]);
  const [requests,      setRequests]      = useState({}); // matchId/teamId/tourId -> requests[]
  const [loading,       setLoading]       = useState(true);
  const [status,        setStatus]        = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const fetchUser = async () => {
    try {
      const me = await api("user/users/me");
      setUser(me);
    } catch {
      window.location.href = "/auth";
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const loadData = async () => {
    if (!user?._id) return;
    const id = user._id;
    setLoading(true);
    try {
      const [matchesMine, matchesJoined, teamsMine, teamsJoined, toursMine, toursJoined, bookingsMine, ordersMine] = await Promise.all([
        api(`player/matches/mine?userId=${id}`).catch(() => []),
        api(`player/matches/joined?userId=${id}`).catch(() => []),
        api(`team/teams/mine?userId=${id}`).catch(() => []),
        api(`team/teams/joined?userId=${id}`).catch(() => ({ teams: [], requests: [] })),
        api(`tournament/tournaments/mine?userId=${id}`).catch(() => []),
        api(`tournament/tournaments/joined?userId=${id}`).catch(() => []),
        api(`ground/bookings/mine?userId=${id}`).catch(() => []),
        api(`shop/orders/mine?userId=${id}`).catch(() => []),
      ]);

      setMyMatches(matchesMine);
      setJoinedMatches(matchesJoined);
      setMyTeams(teamsMine);
      setJoinedTeams(teamsJoined.teams || []);
      setTeamRequests(teamsJoined.requests || []);
      setMyTournaments(toursMine);
      setJoinedTours(toursJoined);
      setMyBookings(bookingsMine);
      setMyOrders(ordersMine);
    } catch (e) {
      toast("Failed to load profile data", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  const loadJoinRequests = async (type, resourceId) => {
    if (requests[resourceId]) return;
    try {
      let rows = [];
      if (type === "match") rows = await api(`player/matches/${resourceId}/requests`);
      if (type === "team")  rows = await api(`team/teams/${resourceId}/requests`);
      if (type === "tour")  rows = await api(`tournament/tournaments/${resourceId}/registrations`);
      setRequests((p) => ({ ...p, [resourceId]: rows }));
    } catch (e) { toast(e.message, true); }
  };

  const handleApproval = async (type, resourceId, requestId, action) => {
    try {
      let endpoint = "";
      if (type === "match") endpoint = `player/matches/${resourceId}/requests/${requestId}`;
      if (type === "team")  endpoint = `team/teams/${resourceId}/requests/${requestId}`;
      if (type === "tour")  endpoint = `tournament/tournaments/${resourceId}/registrations/${requestId}`;
      
      await api(endpoint, { method: "PATCH", body: { action } });
      toast(`Request ${action}d!`);
      
      // Refresh requests for this resource
      let rows = [];
      if (type === "match") rows = await api(`player/matches/${resourceId}/requests`);
      if (type === "team")  rows = await api(`team/teams/${resourceId}/requests`);
      if (type === "tour")  rows = await api(`tournament/tournaments/${resourceId}/registrations`);
      setRequests((p) => ({ ...p, [resourceId]: rows }));
      
      // Notify the user who sent the request
      const targetRequest = requests[resourceId].find(r => (r._id === requestId || r.userId === requestId));
      if (targetRequest) {
        api("user/notifications", {
          method: "POST",
          body: {
            userId: targetRequest.userId,
            title: `Request ${action}d!`,
            message: `Your request to join ${type} has been ${action}d.`,
            type: "alert"
          }
        }).catch(() => {});
      }

      loadData(); // Refresh counts
    } catch (e) { toast(e.message, true); }
  };

  if (!user || loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">Loading your profile hub…</p>
      </div>
    );
  }

  const initials = user.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";
  const totalActivity = myMatches.length + joinedMatches.length + myTeams.length + joinedTeams.length + myOrders.length + myBookings.length;

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">My Hub</h1>
        <p className="page-subtitle">Manage your creations, track requests and view history.</p>
      </div>

      <div className="page-body">
        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* HERO */}
        <div className="card card-accent mb-6 fade-up-2" style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--accent), var(--accent-3))",
            display: "grid", placeItems: "center", fontSize: 28, fontWeight: 800, color: "#fff",
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{user.fullName}</div>
            <div className="text-muted text-sm">{user.email}</div>
            <div className="flex gap-2 mt-2">
              <Badge label={user.role || "member"} />
              {user.city && <span className="badge badge-blue">📍 {user.city}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)" }}>{totalActivity}</div>
            <div className="text-muted text-xs">Activities</div>
          </div>
        </div>

        {/* STATS */}
        <div className="stat-grid fade-up-3" style={{ marginBottom: 28 }}>
          {[
            { icon: "⚽", label: "Matches", value: myMatches.length + joinedMatches.length, color: "rgba(79,140,255,0.15)" },
            { icon: "🛡️", label: "Teams", value: myTeams.length + joinedTeams.length, color: "rgba(168,85,247,0.12)" },
            { icon: "🏆", label: "Tournaments", value: myTournaments.length + joinedTours.length, color: "rgba(251,191,36,0.12)" },
            { icon: "📍", label: "Bookings", value: myBookings.length, color: "rgba(255,77,109,0.12)" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon-wrap" style={{ background: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-4" style={{ flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
          {TABS.map((t) => (
            <button key={t.id} className={`btn btn-sm ${tab === t.id ? "btn-primary" : "btn-outline"}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Recent Activity</span></div>
              <div className="form-stack">
                {[...myMatches, ...joinedMatches].slice(0, 3).map(m => (
                  <div key={m._id} style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>⚽</span>
                    <div><div className="text-sm font-bold">{m.title}</div><div className="text-muted text-xs">Match activity</div></div>
                  </div>
                ))}
                {totalActivity === 0 && <EmptyState icon="🌱" text="No activity yet." action="/matches" actionLabel="Find Matches" />}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">My Stats</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="stat-card" style={{ padding: 15 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{myOrders.length}</div>
                  <div className="stat-label">Orders</div>
                </div>
                <div className="stat-card" style={{ padding: 15 }}>
                  <div className="stat-value" style={{ fontSize: 24 }}>{myBookings.length}</div>
                  <div className="stat-label">Bookings</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MY MATCHES ── */}
        {tab === "my-matches" && (
          <div className="form-stack">
            <p className="section-title">Created Matches</p>
            {myMatches.map(m => (
              <div className="card mb-3" key={m._id}>
                <div className="flex-between">
                  <div>
                    <div className="font-bold">{m.title}</div>
                    <div className="text-muted text-sm">{m.location} · {m.sport}</div>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => loadJoinRequests("match", m._id)}>Manage Requests</button>
                </div>
                {requests[m._id] && (
                  <div className="mt-4 border-t pt-3">
                    {requests[m._id].length === 0 ? <p className="text-muted text-sm">No requests.</p> : requests[m._id].map(r => (
                      <div key={r._id} className="flex-between py-2 border-b last:border-0">
                        <div><span className="text-sm">User {r.userId.slice(-6)}</span> <Badge label={r.status}/></div>
                        {r.status === "waiting" && (
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-green" onClick={() => handleApproval("match", m._id, r.userId, "approve")}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleApproval("match", m._id, r.userId, "reject")}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {myMatches.length === 0 && <EmptyState icon="⚽" text="No matches created." />}
            
            <p className="section-title mt-6">Joined Matches</p>
            <div className="item-grid">
              {joinedMatches.map(m => (
                <div className="item-card" key={m._id}>
                  <div className="item-card-title">{m.title}</div>
                  <div className="item-card-footer"><Badge label={m.joinStatus}/></div>
                </div>
              ))}
            </div>
            {joinedMatches.length === 0 && <EmptyState icon="🤝" text="No matches joined." />}
          </div>
        )}

        {/* ── MY TEAMS ── */}
        {tab === "my-teams" && (
          <div className="form-stack">
            <p className="section-title">Teams I Captain</p>
            {myTeams.map(t => (
              <div className="card mb-3" key={t._id}>
                <div className="flex-between">
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-muted text-sm">Invite Code: <span className="text-primary font-mono">{t.inviteCode}</span></div>
                  </div>
                  <button className="btn btn-sm btn-outline" onClick={() => loadJoinRequests("team", t._id)}>Manage Members</button>
                </div>
                {requests[t._id] && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs text-muted mb-2">JOIN REQUESTS</p>
                    {requests[t._id].length === 0 ? <p className="text-muted text-sm">No pending requests.</p> : requests[t._id].map(r => (
                      <div key={r._id} className="flex-between py-2 border-b last:border-0">
                        <div><span className="text-sm">User {r.userId.slice(-6)}</span> <Badge label={r.status}/></div>
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-green" onClick={() => handleApproval("team", t._id, r._id, "approve")}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleApproval("team", t._id, r._id, "reject")}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted mb-2">MEMBERS ({t.members?.length || 0})</p>
                  <div className="flex gap-2 flex-wrap">
                    {t.members?.map(m => <span key={m.userId} className="badge badge-blue">…{m.userId.slice(-6)} ({m.role})</span>)}
                  </div>
                </div>
              </div>
            ))}
            {myTeams.length === 0 && <EmptyState icon="🛡️" text="You aren't a captain of any team." />}

            <p className="section-title mt-6">Joined Teams</p>
            <div className="item-grid">
              {joinedTeams.map(t => (
                <div className="item-card" key={t._id}>
                  <div className="item-card-title">{t.name}</div>
                  <div className="item-card-footer"><Badge label="Member"/></div>
                </div>
              ))}
              {teamRequests.map(r => (
                <div className="item-card" key={r._id} style={{ opacity: 0.7 }}>
                  <div className="item-card-title">{r.teamName}</div>
                  <div className="item-card-footer"><Badge label={r.status}/></div>
                </div>
              ))}
            </div>
            {joinedTeams.length === 0 && teamRequests.length === 0 && <EmptyState icon="🤝" text="No teams joined or pending." />}
          </div>
        )}

        {/* ── MY TOURNAMENTS ── */}
        {tab === "my-tournaments" && (
          <div className="form-stack">
            <p className="section-title">My Tournaments</p>
            {myTournaments.map(t => (
              <div className="card mb-3" key={t._id}>
                <div className="flex-between">
                  <div><div className="font-bold">{t.name}</div><div className="text-muted text-sm">{t.sport} · {t.city}</div></div>
                  <button className="btn btn-sm btn-outline" onClick={() => loadJoinRequests("tour", t._id)}>Registrations</button>
                </div>
                {requests[t._id] && (
                  <div className="mt-4 border-t pt-3">
                    {requests[t._id].map(r => (
                      <div key={r._id} className="flex-between py-2 border-b last:border-0">
                        <div><span className="text-sm">User {r.userId.slice(-6)}</span> <Badge label={r.status}/></div>
                        {r.status === "pending" && (
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-green" onClick={() => handleApproval("tour", t._id, r.userId, "approve")}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleApproval("tour", t._id, r.userId, "reject")}>Reject</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p className="section-title mt-6">Participating</p>
            <div className="item-grid">
              {joinedTours.map(t => (
                <div className="item-card" key={t._id}>
                  <div className="item-card-title">{t.name}</div>
                  <div className="item-card-footer"><Badge label={t.regStatus}/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MY BOOKINGS ── */}
        {tab === "my-bookings" && (
          <div className="item-grid">
            {myBookings.map(b => (
              <div className="item-card" key={b._id}>
                <div className="item-card-title">{b.ground?.name || "Ground Booking"}</div>
                <div className="item-card-meta"><span>🗓 {b.date}</span></div>
                <div className="item-card-footer"><Badge label={b.status}/></div>
              </div>
            ))}
            {myBookings.length === 0 && <EmptyState icon="📍" text="No bookings yet." />}
          </div>
        )}

        {/* ── MY ORDERS ── */}
        {tab === "my-orders" && (
          <div className="form-stack">
            {myOrders.map(o => (
              <div className="card mb-3" key={o._id}>
                <div className="flex-between">
                  <div><div className="font-bold">{o.invoiceNumber}</div><div className="text-muted text-sm">₹{o.total}</div></div>
                  <Badge label={o.status}/>
                </div>
              </div>
            ))}
            {myOrders.length === 0 && <EmptyState icon="🛒" text="No orders yet." />}
          </div>
        )}
      </div>
    </>
  );
}
