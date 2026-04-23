"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const REPORT_TYPES = ["spam", "abuse", "fraud", "bug", "other"];

const METRIC_CONFIG = [
  { key: "users",       label: "Total Users",       icon: "👥", color: "rgba(79,140,255,0.15)"  },
  { key: "matches",     label: "Total Matches",      icon: "⚽", color: "rgba(0,229,160,0.12)"  },
  { key: "teams",       label: "Total Teams",        icon: "🛡️", color: "rgba(168,85,247,0.12)" },
  { key: "tournaments", label: "Tournaments",         icon: "🏆", color: "rgba(251,191,36,0.12)" },
  { key: "reports",     label: "Open Reports",        icon: "🚨", color: "rgba(255,77,109,0.12)" },
];

export default function AdminPage() {
  const router    = useRouter();
  const [ready,   setReady]     = useState(false);
  const [dash,    setDash]      = useState(null);
  const [report,  setReport]    = useState({ type: "", payload: "" });
  const [status,  setStatus]    = useState({ msg: "", err: false });
  const [loading, setLoading]   = useState(false);

  const toast = (msg, err = false) => setStatus({ msg, err });

  useEffect(() => {
    api("user/users/me")
      .then((me) => {
        if ((me.role || "user") !== "admin") { router.replace("/"); return; }
        setReady(true);
        loadDash();
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  const loadDash = async () => {
    setLoading(true);
    try { setDash(await api("admin/admin/dashboard")); }
    catch (e) { toast(e.message, true); }
    finally { setLoading(false); }
  };

  const createReport = async (e) => {
    e.preventDefault();
    let payload = {};
    try { payload = report.payload ? JSON.parse(report.payload) : {}; }
    catch { toast("Payload must be valid JSON.", true); return; }
    try {
      await api("admin/admin/reports", { method: "POST", body: { type: report.type, payload } });
      toast("Report submitted successfully.");
      setReport({ type: "", payload: "" });
      loadDash();
    } catch (err) { toast(err.message, true); }
  };

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">Verifying admin access…</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">🔧 Admin Control Center</h1>
        <p className="page-subtitle">Platform health, moderation reports and operational analytics.</p>
      </div>

      <div className="page-body">
        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* METRICS */}
        <div className="flex-between mb-3 fade-up-2">
          <p className="section-title">Platform Metrics</p>
          <button className="btn btn-sm btn-outline" onClick={loadDash} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>

        <div className="stat-grid fade-up-2" style={{ marginBottom: 28 }}>
          {METRIC_CONFIG.map(({ key, label, icon, color }) => (
            <div className="stat-card" key={key}>
              <div className="stat-icon-wrap" style={{ background: color }}>{icon}</div>
              <div className="stat-value">
                {dash ? (dash[key] ?? dash.counts?.[key] ?? "—") : "—"}
              </div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* RAW DASHBOARD + REPORT */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }} className="fade-up-3">
          {/* RAW */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Raw Dashboard Data</span>
              <div className="card-icon" style={{ background: "rgba(79,140,255,0.12)" }}>📊</div>
            </div>
            {dash ? (
              <pre style={{
                background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "14px", fontSize: 12,
                color: "var(--muted-2)", overflow: "auto", maxHeight: 280,
                fontFamily: "'Courier New', monospace", lineHeight: 1.6
              }}>
                {JSON.stringify(dash, null, 2)}
              </pre>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p className="text-muted text-sm">Click Refresh to load metrics.</p>
              </div>
            )}
          </div>

          {/* REPORT */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Create Moderation Report</span>
              <div className="card-icon" style={{ background: "rgba(255,77,109,0.12)" }}>🚨</div>
            </div>
            <form className="form-stack" onSubmit={createReport}>
              <label>
                Report Type
                <select value={report.type}
                  onChange={(e) => setReport({ ...report, type: e.target.value })} required>
                  <option value="">Select type</option>
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label>
                Payload <span className="text-muted" style={{ textTransform: "none", fontWeight: 400 }}>(JSON, optional)</span>
                <textarea
                  placeholder={'{\n  "userId": "abc123",\n  "reason": "spamming"\n}'}
                  value={report.payload}
                  onChange={(e) => setReport({ ...report, payload: e.target.value })}
                  style={{ fontFamily: "monospace", fontSize: 13 }}
                />
              </label>
              <button type="submit" className="btn btn-danger" style={{ marginTop: 4 }}>
                🚨 Submit Report
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
