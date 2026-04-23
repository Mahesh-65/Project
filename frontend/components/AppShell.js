"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";

const NAV_ITEMS = [
  ["Dashboard", "/"],
  ["Matches", "/matches"],
  ["Teams", "/teams"],
  ["Tournaments", "/tournaments"],
  ["Grounds", "/grounds"],
  ["Shop", "/shop"],
  ["Admin", "/admin"]
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const me = await api("user/users/me");
        if (!mounted) return;
        setUser(me);
        setChecking(false);
        if (pathname === "/auth") router.replace("/");
      } catch {
        if (!mounted) return;
        setUser(null);
        setChecking(false);
        if (pathname !== "/auth") router.replace("/auth");
      }
    };
    checkAuth();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  const logout = async () => {
    await api("user/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/auth");
  };

  if (checking) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>Loading Sports Community...</h2>
          <p className="muted">Checking secure session.</p>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === "/auth";
  if (!isAuthPage && !user) return null;

  return (
    <>
      {!isAuthPage ? (
        <header className="header pro-header">
          <div>
            <h1>Sports Community</h1>
            <p className="muted">Play smarter. Connect faster.</p>
          </div>
          <nav>
            {NAV_ITEMS.map(([label, href]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
            <button onClick={logout}>Logout</button>
          </nav>
        </header>
      ) : null}
      <main className="container">{children}</main>
    </>
  );
}
