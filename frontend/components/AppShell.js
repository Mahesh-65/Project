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
  { label: "LFP (Urgent)",  href: "/lfp",          icon: "🔥" },
  { label: "Shop",        href: "/shop",         icon: "🛒" },
  { label: "Notifications", href: "/profile?tab=notifications", icon: "🔔" },
  { label: "My Profile",  href: "/profile",      icon: "👤" },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user,     setUser]     = useState(null);
  const [unread,   setUnread]   = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    api("user/users/me")
      .then((me) => {
        if (!alive) return;
        setUser(me);
        setChecking(false);
        if (pathname === "/auth") router.replace("/");
        if (pathname.startsWith("/admin") && (me.role || "user") !== "admin") router.replace("/");
      })
      .catch(() => {
        if (!alive) return;
        setUser(null);
        setChecking(false);
        if (pathname !== "/auth") router.replace("/auth");
      });
    return () => { alive = false; };
  }, [pathname, router]);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api("user/notifications")
        .then((list) => setUnread(list.filter((n) => !n.read).length))
        .catch(() => {});
    };
    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => clearInterval(timer);
  }, [user, pathname]);

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
              className={`nav-link${pathname === href || (href.includes('tab=notifications') && pathname === '/profile') ? " active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {label === "Notifications" && unread > 0 && (
                <span className="nav-badge">{unread}</span>
              )}
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
        {children}
      </main>
    </div>
  );
}
