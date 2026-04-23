"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";

const NAV = [
  { label: "Dashboard",   href: "/",            icon: "⚡" },
  { label: "Matches",     href: "/matches",      icon: "⚽" },
  { label: "Teams",       href: "/teams",        icon: "🛡️" },
  { label: "Tournaments", href: "/tournaments",  icon: "🏆" },
  { label: "Grounds",     href: "/grounds",      icon: "📍" },
  { label: "Shop",        href: "/shop",         icon: "🛒" },
  { label: "My Profile",  href: "/profile",      icon: "👤" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true);
  const [notifs,   setNotifs]   = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchNotifs = async () => {
    try {
      const data = await api("user/notifications");
      setNotifs(data || []);
    } catch {}
  };

  useEffect(() => {
    let alive = true;
    if (!user || pathname === "/auth") {
      api("user/users/me")
        .then((me) => {
          if (!alive) return;
          setUser(me);
          setChecking(false);
          fetchNotifs();
          if (pathname === "/auth") router.replace("/");
        })
        .catch(() => {
          if (!alive) return;
          setUser(null);
          setChecking(false);
          if (pathname !== "/auth") router.replace("/auth");
        });
    } else {
      setChecking(false);
      if (pathname.startsWith("/admin") && (user.role || "user") !== "admin") router.replace("/");
    }
    return () => { alive = false; };
  }, [pathname, router, user]);

  useEffect(() => {
    if (!user) return;
    const timer = setInterval(fetchNotifs, 30000);
    return () => clearInterval(timer);
  }, [user]);

  const markRead = async (id) => {
    try {
      await api(`user/notifications/${id}/read`, { method: "PATCH" });
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {}
  };

  const logout = async () => {
    await api("user/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/auth");
  };

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">Connecting to SportsHub…</p>
      </div>
    );
  }

  if (pathname === "/auth") {
    return <>{children}</>;
  }

  if (!user) return null;

  const unreadCount = notifs.filter(n => !n.read).length;
  const initials = user.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <div className="brand-icon">⚡</div>
            <span className="brand-name">SportsHub</span>
          </div>
          <p className="brand-tagline">Play smarter. Connect faster.</p>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Platform</span>
          {NAV.map(({ label, href, icon }) => (
            <a
              key={href}
              href={href}
              className={`nav-link${pathname === href ? " active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </a>
          ))}

          {(user.role || "user") === "admin" && (
            <>
              <span className="nav-section-label" style={{ marginTop: 8 }}>Admin</span>
              <a href="/admin" className={`nav-link${pathname === "/admin" ? " active" : ""}`}>
                <span className="nav-icon">🔧</span>
                Control Center
              </a>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user.fullName || "User"}</div>
              <div className="user-role">{user.role || "member"}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="main-header">
           <div style={{ flex: 1 }} />
           <div className="header-actions">
              <div className="notif-bell-wrap" onClick={() => setShowNotifs(!showNotifs)}>
                <span className="notif-bell">🔔</span>
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                
                {showNotifs && (
                  <div className="notif-dropdown card fade-in">
                    <div className="notif-header">Notifications</div>
                    <div className="notif-list">
                      {notifs.length === 0 ? (
                        <div className="p-4 text-center text-muted text-sm">No notifications</div>
                      ) : (
                        notifs.map(n => (
                          <div key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`} onClick={(e) => { e.stopPropagation(); markRead(n._id); }}>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-msg">{n.message}</div>
                            <div className="notif-time">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
           </div>
        </header>
        <div className="main-body">
          {children}
        </div>
      </main>
    </div>
  );
}
