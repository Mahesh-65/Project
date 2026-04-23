"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function GroundsPage() {
  const [userId, setUserId]  = useState(null);
  const [tab,    setTab]    = useState("search");
  const [ground, setGround] = useState({ name: "", area: "", city: "", hourlyPrice: "" });
  const [search, setSearch] = useState("");
  const [rows,   setRows]   = useState([]);
  const [status, setStatus] = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  const notify = async (userId, title, message, type = "info") => {
    try { await api("user/notifications", { method: "POST", body: { userId, title, message, type } }); }
    catch (e) { console.error("Notify failed", e); }
  };

  useEffect(() => {
    load();
    api("user/users/me").then((me) => setUserId(me._id)).catch(() => {});
  }, []);

  const load = async () => {
    try { setRows(await api("ground/grounds/search?q=")); }
    catch (e) { toast(e.message, true); }
  };

  const addGround = async (e) => {
    e.preventDefault();
    try {
      await api("ground/grounds", { method: "POST", body: { ...ground, hourlyPrice: Number(ground.hourlyPrice), ownerId: userId } });
      toast("Ground listed successfully!");
      setGround({ name: "", area: "", city: "", hourlyPrice: "" });
      setTab("search");
    } catch (err) { toast(err.message, true); }
  };

  const doSearch = async () => {
    try {
      setRows(await api(`ground/grounds/search?q=${encodeURIComponent(search)}`));
    } catch (err) { toast(err.message, true); }
  };

  const doBook = async (groundId, ownerId) => {
    try {
      await api("ground/bookings", {
        method: "POST",
        body: { groundId, userId, date: new Date().toISOString().split('T')[0], slots: "1 Hour" }
      });
      toast("Booking request sent! Check your profile for status.");
      if (ownerId && ownerId !== userId) {
        await notify(ownerId, "New Ground Booking", `Someone booked your turf.`, "info");
      }
    } catch (err) { toast(err.message, true); }
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">📍 Ground Booking</h1>
        <p className="page-subtitle">Discover turfs, reserve time slots and split expenses with your squad.</p>
      </div>

      <div className="page-body">
        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["search", "add"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ search: "🔍 Find Grounds", add: "➕ List Ground" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* SEARCH */}
        {tab === "search" && (
          <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card" style={{ maxWidth: 560 }}>
              <div className="card-header">
                <span className="card-title">Search Grounds</span>
                <div className="card-icon" style={{ background: "rgba(251,191,36,0.12)" }}>🔍</div>
              </div>
              <div className="flex gap-3" style={{ alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label>
                    Name, Area or City
                    <input
                      placeholder="e.g. Andheri, Mumbai"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    />
                  </label>
                </div>
                <button className="btn btn-primary" onClick={doSearch} style={{ flexShrink: 0 }}>
                  Search →
                </button>
              </div>
            </div>

            {rows.length > 0 && (
              <div>
                <p className="section-title">{rows.length} Ground{rows.length !== 1 ? "s" : ""} Found</p>
                <div className="item-grid">
                  {rows.map((g) => (
                    <div className="item-card" key={g._id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: "rgba(251,191,36,0.12)",
                          display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0
                        }}>📍</div>
                        <div>
                          <div className="item-card-title">{g.name}</div>
                          <div className="text-muted text-sm">{g.area}, {g.city}</div>
                        </div>
                      </div>
                      <div className="item-card-footer">
                        {g.hourlyPrice
                          ? <span className="badge badge-amber">₹{g.hourlyPrice}/hr</span>
                          : <span className="badge badge-blue">Contact for price</span>}
                        <button className="btn btn-sm btn-outline" onClick={() => doBook(g._id, g.ownerId)}>Book →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rows.length === 0 && search && (
              <div className="card" style={{ textAlign: "center", padding: "36px" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <p className="font-bold">No grounds found</p>
                <p className="text-muted text-sm mt-2">Try a different area or city name.</p>
              </div>
            )}
          </div>
        )}

        {/* ADD GROUND */}
        {tab === "add" && (
          <div className="card fade-up-2" style={{ maxWidth: 640 }}>
            <div className="card-header">
              <span className="card-title">List a Ground</span>
              <div className="card-icon" style={{ background: "rgba(79,140,255,0.12)" }}>📍</div>
            </div>
            <form className="form-stack" onSubmit={addGround}>
              <label>
                Ground / Turf Name
                <input placeholder="e.g. Green Valley Turf" value={ground.name}
                  onChange={(e) => setGround({ ...ground, name: e.target.value })} required />
              </label>
              <div className="form-row">
                <label>
                  Area / Locality
                  <input placeholder="e.g. Andheri West" value={ground.area}
                    onChange={(e) => setGround({ ...ground, area: e.target.value })} required />
                </label>
                <label>
                  City
                  <input placeholder="e.g. Mumbai" value={ground.city}
                    onChange={(e) => setGround({ ...ground, city: e.target.value })} required />
                </label>
              </div>
              <label>
                Hourly Price (₹)
                <input type="number" placeholder="e.g. 800" value={ground.hourlyPrice}
                  onChange={(e) => setGround({ ...ground, hourlyPrice: e.target.value })} required />
              </label>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                List Ground →
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
