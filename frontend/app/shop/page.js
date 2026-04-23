"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const CATEGORIES = ["Footwear", "Apparel", "Equipment", "Accessories", "Nutrition", "Other"];

export default function ShopPage() {
  const [userId,   setUserId]   = useState(null);
  const [tab,      setTab]      = useState("catalog");
  const [products, setProducts] = useState([]);
  const [form,     setForm]     = useState({ name: "", category: "", price: "", stock: "" });
  const [status,   setStatus]   = useState({ msg: "", err: false });

  const toast = (msg, err = false) => setStatus({ msg, err });

  useEffect(() => {
    load();
    api("user/users/me").then((me) => setUserId(me._id)).catch(() => {});
  }, []);

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await api("shop/products", {
        method: "POST",
        body: { ...form, price: Number(form.price), stock: Number(form.stock), createdBy: userId },
      });
      toast("Product added to catalog!");
      setForm({ name: "", category: "", price: "", stock: "" });
      setTab("catalog");
      load();
    } catch (err) { toast(err.message, true); }
  };

  const doCheckout = async (productId, price) => {
    try {
      await api("shop/checkout", {
        method: "POST",
        body: { userId, items: [{ productId, price, qty: 1 }] }
      });
      toast("Order placed! Track it in your profile.");
    } catch (err) { toast(err.message, true); }
  };

  const CATEGORY_COLORS = {
    Footwear:    "rgba(79,140,255,0.15)",
    Apparel:     "rgba(168,85,247,0.15)",
    Equipment:   "rgba(0,229,160,0.12)",
    Accessories: "rgba(251,191,36,0.12)",
    Nutrition:   "rgba(255,77,109,0.12)",
    Other:       "rgba(255,255,255,0.06)",
  };

  const CATEGORY_EMOJIS = {
    Footwear: "👟", Apparel: "👕", Equipment: "🏅",
    Accessories: "⌚", Nutrition: "💊", Other: "📦",
  };

  return (
    <>
      <div className="page-header fade-up">
        <h1 className="page-title">🛒 Sports Store</h1>
        <p className="page-subtitle">Browse the catalog, manage inventory and handle orders.</p>
      </div>

      <div className="page-body">
        {/* TABS */}
        <div className="flex gap-2 mb-6 fade-up-2">
          {["catalog", "add"].map((t) => (
            <button
              key={t}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`}
              onClick={() => setTab(t)}
            >
              {{ catalog: "🛍️ Catalog", add: "➕ Add Product" }[t]}
            </button>
          ))}
        </div>

        {status.msg && (
          <p className={`status-bar mb-4${status.err ? " error" : ""}`}>{status.msg}</p>
        )}

        {/* CATALOG */}
        {tab === "catalog" && (
          <div className="fade-up-2">
            {products.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "48px" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
                <p className="font-bold">No products yet</p>
                <p className="text-muted text-sm mt-2">Add your first product to the catalog.</p>
                <button className="btn btn-primary mt-4" onClick={() => setTab("add")}>
                  Add Product →
                </button>
              </div>
            ) : (
              <>
                <div className="flex-between mb-4">
                  <p className="section-title">{products.length} Product{products.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="item-grid">
                  {products.map((p) => (
                    <div className="item-card" key={p._id}>
                      <div style={{
                        width: "100%", height: 80, borderRadius: 10, marginBottom: 14,
                        background: CATEGORY_COLORS[p.category] || "rgba(255,255,255,0.06)",
                        display: "grid", placeItems: "center",
                        fontSize: 36,
                      }}>
                        {CATEGORY_EMOJIS[p.category] || "📦"}
                      </div>
                      <div className="item-card-title">{p.name}</div>
                      <div className="item-card-meta">
                        <div className="flex gap-2 mt-2" style={{ flexWrap: "wrap" }}>
                          <span className="badge badge-blue">{p.category}</span>
                          {p.stock <= 5 && <span className="badge badge-red">Low Stock</span>}
                        </div>
                      </div>
                      <div className="item-card-footer">
                        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--accent-2)" }}>
                          ₹{p.price?.toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <span className="text-muted text-xs" style={{ alignSelf: "center", marginRight: 8 }}>{p.stock} in stock</span>
                          <button className="btn btn-sm btn-primary" onClick={() => doCheckout(p._id, p.price)}>Buy →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ADD PRODUCT */}
        {tab === "add" && (
          <div className="card fade-up-2" style={{ maxWidth: 640 }}>
            <div className="card-header">
              <span className="card-title">New Product</span>
              <div className="card-icon" style={{ background: "rgba(255,77,109,0.12)" }}>🛒</div>
            </div>
            <form className="form-stack" onSubmit={addProduct}>
              <label>
                Product Name
                <input placeholder="e.g. Nike Mercurial Vapor" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <div className="form-row">
                <label>
                  Category
                  <select value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>
                  Price (₹)
                  <input type="number" placeholder="e.g. 4999" value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </label>
              </div>
              <label>
                Stock Quantity
                <input type="number" placeholder="e.g. 50" value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
              </label>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>
                Add to Catalog →
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
