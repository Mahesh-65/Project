"use client";
import { useState } from "react";
import { api } from "../../lib/api";

export default function GroundsPage() {
  const [ground, setGround] = useState({ name: "", area: "", city: "", hourlyPrice: "" });
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");

  const create = async (e) => {
    e.preventDefault();
    try { await api("ground/grounds", { method: "POST", body: ground }); setStatus("Ground added"); } catch (err) { setStatus(err.message); }
  };

  const doSearch = async () => {
    try { setRows(await api(`ground/grounds/search?q=${encodeURIComponent(search)}`)); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="module-page">
      <div className="card">
        <h1>Ground & Turf Booking</h1>
        <p className="muted">Publish venues and help players discover the best playing spots.</p>
      </div>
      <div className="grid">
      <article className="card">
        <h2>Add Ground</h2>
        <form className="form-grid" onSubmit={create}>
          <input placeholder="Name" value={ground.name} onChange={(e)=>setGround({...ground,name:e.target.value})} required/>
          <input placeholder="Area" value={ground.area} onChange={(e)=>setGround({...ground,area:e.target.value})} required/>
          <input placeholder="City" value={ground.city} onChange={(e)=>setGround({...ground,city:e.target.value})} required/>
          <input type="number" placeholder="Hourly Price" value={ground.hourlyPrice} onChange={(e)=>setGround({...ground,hourlyPrice:Number(e.target.value) || ""})} required/>
          <button type="submit">Add</button>
        </form>
      </article>
      <article className="card">
        <h2>Search Grounds</h2>
        <div className="stack">
        <input placeholder="Search by name/area" value={search} onChange={(e)=>setSearch(e.target.value)}/>
        <button onClick={doSearch}>Search</button>
        </div>
        <div className="list-grid">
          {rows.map((g)=><div className="card" key={g._id}><strong>{g.name}</strong><p className="muted">{g.area}, {g.city}</p></div>)}
        </div>
        <p className="muted">{status}</p>
      </article>
      </div>
    </section>
  );
}
