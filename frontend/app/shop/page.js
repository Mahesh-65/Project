"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function ShopPage() {
  const [product, setProduct] = useState({ name: "", category: "", price: 0, stock: 0, customizable: false });
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    try { setProducts(await api("shop/products")); } catch (err) { setStatus(err.message); }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try { await api("shop/products", { method: "POST", body: product }); setStatus("Product added"); await load(); } catch (err) { setStatus(err.message); }
  };

  return (
    <section className="grid">
      <article className="card"><h2>Add Product</h2><form className="row" onSubmit={add}><input placeholder="Name" value={product.name} onChange={(e)=>setProduct({...product,name:e.target.value})} required/><input placeholder="Category" value={product.category} onChange={(e)=>setProduct({...product,category:e.target.value})} required/><input type="number" placeholder="Price" value={product.price} onChange={(e)=>setProduct({...product,price:Number(e.target.value)})} required/><input type="number" placeholder="Stock" value={product.stock} onChange={(e)=>setProduct({...product,stock:Number(e.target.value)})} required/><button type="submit">Save</button></form></article>
      <article className="card"><h2>Catalog</h2><div className="grid">{products.map((p)=><div key={p._id} className="card"><strong>{p.name}</strong><p className="muted">{p.category} | ${p.price}</p></div>)}</div><p className="muted">{status}</p></article>
    </section>
  );
}
