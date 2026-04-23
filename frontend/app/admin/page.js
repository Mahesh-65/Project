"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function AdminPage() {
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState({ type: "", payload: "" });
  const [status, setStatus] = useState("");

  const load = async () => {
    try {
      setDashboard(await api("admin/admin/dashboard"));
    } catch (err) {
      setStatus(err.message);
    }
  };

  const createReport = async (e) => {
    e.preventDefault();
    try {
      await api("admin/admin/reports", {
        method: "POST",
        body: { type: report.type, payload: JSON.parse(report.payload || "{}") }
      });
      setStatus("Report created");
      await load();
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <section className="module-page">
      <div className="card">
        <h1>Admin Control Center</h1>
        <p className="muted">Track platform health and create moderation reports.</p>
      </div>
      <div className="grid">
      <article className="card">
        <h2>Dashboard</h2>
        <button onClick={load}>Load Metrics</button>
        {dashboard ? <pre className="muted">{JSON.stringify(dashboard, null, 2)}</pre> : <p className="muted">Click load to fetch analytics.</p>}
      </article>
      <article className="card">
        <h2>Create Report</h2>
        <form className="stack" onSubmit={createReport}>
          <input placeholder="Type" value={report.type} onChange={(e) => setReport({ ...report, type: e.target.value })} required />
          <textarea placeholder='Payload JSON, e.g. {"reason":"spam"}' value={report.payload} onChange={(e) => setReport({ ...report, payload: e.target.value })} />
          <button type="submit">Submit</button>
        </form>
        <p className="muted">{status}</p>
      </article>
      </div>
    </section>
  );
}
