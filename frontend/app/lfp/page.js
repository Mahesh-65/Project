"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const STARTS_IN = ["ASAP", "15 mins", "30 mins", "1 hour", "2 hours", "Tonight"];

export default function LFPPage() {
  const [userId, setUserId] = useState(null);
  const [tab, setTab] = useState("feed");
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", sport: "", location: "", playersNeeded: 1, startsIn: "ASAP" });
  const [status, setStatus] = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const notify = async (userId, title, message, type = "info") => {
    try { await api("user/notifications", { method: "POST", body: { userId, title, message, type } }); }
    catch (e) { console.error("Notify failed", e); }
  };

  const load = async () => {
    try { setList(await api("player/lfp")); }
    catch (e) { toast(e.message, true); }
  };

  useEffect(() => {
    load();
    api("user/users/me").then((me) => setUserId(me._id)).catch(() => {});
  }, []);

  const postLFP = async (e) => {
    e.preventDefault();
    try {
      await api("player/lfp", { method: "POST", body: { ...form, createdBy: userId } });
      toast("LFP request posted!");
      setForm({ title: "", sport: "", location: "", playersNeeded: 1, startsIn: "ASAP" });
      setTab("feed");
      load();
    } catch (e) { toast(e.message, true); }
  };

  const respondToLFP = async (creatorId, title) => {
    if (!userId) return;
    try {
      await notify(creatorId, "New Player Interest!", `Someone is interested in your LFP: ${title}`, "success");
      toast("Interest sent! The creator will be notified.");
    } catch (e) { toast(e.message, true); }
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">🔥 Looking for Players</h1>
        <p className="page-subtitle">Need a player right now? Post a last-minute request or jump into a game nearby.</p>
      </div>

      <div className="page-body">
        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["feed", "post"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ feed: "🕒 Active Requests", post: "📣 Post Request" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* FEED */}
        {tab === "feed" && (
          <div className="fade-up-2">
            {list.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🕒</div>
                <p className="font-bold">No active requests</p>
                <p className="text-muted text-sm mt-2">Everyone seems to have their teams ready. Need someone? Post a request!</p>
                <button className="btn btn-primary mt-4" onClick={() => setTab("post")}>
                  Post LFP →
                </button>
              </div>
            ) : (
              <div className="item-grid">
                {list.map((item) => (
                  <div className="item-card" key={item._id} style={{ borderLeft: "4px solid var(--accent-2)" }}>
                    <div className="flex-between mb-3">
                      <span className="badge badge-red">URGENT</span>
                      <span className="text-muted text-xs">Starts in {item.startsIn}</span>
                    </div>
                    <div className="item-card-title">{item.title}</div>
                    <div className="item-card-meta">
                      <span>🎮 {item.sport}</span>
                      <span>📍 {item.location}</span>
                      <span>👥 Need {item.playersNeeded} player(s)</span>
                    </div>
                    <div className="item-card-footer mt-4">
                      <button className="btn btn-sm btn-primary btn-full" onClick={() => respondToLFP(item.createdBy, item.title)}>
                        I'm Interested! ✋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POST */}
        {tab === "post" && (
          <div className="card fade-up-2" style={{ maxWidth: 600 }}>
            <div className="card-header">
              <span className="card-title">Post LFP Request</span>
              <div className="card-icon" style={{ background: "rgba(255,77,109,0.12)" }}>📣</div>
            </div>
            <form className="form-stack" onSubmit={postLFP}>
              <label>
                Urgent Title
                <input placeholder="e.g. Need 1 keeper for 5-a-side" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <div className="form-row">
                <label>
                  Sport
                  <input placeholder="e.g. Football" value={form.sport}
                    onChange={(e) => setForm({ ...form, sport: e.target.value })} required />
                </label>
                <label>
                  Location
                  <input placeholder="e.g. Goregaon West" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Players Needed
                  <input type="number" min="1" value={form.playersNeeded}
                    onChange={(e) => setForm({ ...form, playersNeeded: e.target.value })} required />
                </label>
                <label>
                  Starts In
                  <select value={form.startsIn} onChange={(e) => setForm({ ...form, startsIn: e.target.value })} required>
                    {STARTS_IN.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                Broadcast Request →
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
