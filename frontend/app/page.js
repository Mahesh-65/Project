const MODULES = [
  {
    emoji: "⚽",
    title: "Match Center",
    desc: "Create games, discover players by location and schedule matches instantly.",
    href: "/matches",
    color: "rgba(79,140,255,0.12)",
  },
  {
    emoji: "🛡️",
    title: "Team Management",
    desc: "Build squads, manage captains, send invites and track team performance.",
    href: "/teams",
    color: "rgba(0,229,160,0.1)",
  },
  {
    emoji: "🏆",
    title: "Tournament Hub",
    desc: "Launch competitions, auto-generate fixtures and monitor standings live.",
    href: "/tournaments",
    color: "rgba(168,85,247,0.1)",
  },
  {
    emoji: "📍",
    title: "Ground Booking",
    desc: "Search turfs, reserve time slots and split expenses fairly.",
    href: "/grounds",
    color: "rgba(251,191,36,0.1)",
  },
  {
    emoji: "🛒",
    title: "Sports Store",
    desc: "Browse products, manage inventory, cart and orders in one place.",
    href: "/shop",
    color: "rgba(255,77,109,0.1)",
  },
];

const STATS = [
  { icon: "👥", label: "Active Players",   value: "2,400+", change: "+12%", up: true,  color: "rgba(79,140,255,0.15)"  },
  { icon: "⚽", label: "Matches Today",    value: "38",      change: "+5",   up: true,  color: "rgba(0,229,160,0.12)"  },
  { icon: "🏆", label: "Live Tournaments", value: "7",       change: "+2",   up: true,  color: "rgba(168,85,247,0.12)" },
  { icon: "📍", label: "Grounds Listed",   value: "120",     change: "+8",   up: true,  color: "rgba(251,191,36,0.12)" },
];

export default function HomePage() {
  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">Welcome back 👋</h1>
        <p className="page-subtitle">Here's what's happening on the platform today.</p>
      </div>

      <div className="page-body">
        {/* STATS */}
        <div className="stat-grid fade-up-2">
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon-wrap" style={{ background: s.color }}>
                {s.icon}
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <span className={`stat-change ${s.up ? "up" : "down"}`}>
                {s.up ? "▲" : "▼"} {s.change} this week
              </span>
            </div>
          ))}
        </div>

        {/* MODULES */}
        <p className="section-title fade-up-3">Platform Modules</p>
        <div className="module-grid fade-up-3">
          {MODULES.map((m) => (
            <a className="module-card" href={m.href} key={m.href}>
              <div className="module-emoji" style={{ background: m.color }}>
                {m.emoji}
              </div>
              <div>
                <div className="module-card-title">{m.title}</div>
                <div className="module-card-desc">{m.desc}</div>
              </div>
              <div className="module-arrow">Open module →</div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
