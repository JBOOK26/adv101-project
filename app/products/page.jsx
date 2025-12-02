// app/products/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Nav from "../components/Nav";
import AuthGuard from "../components/AuthGuard";

function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

// Debounce hook for search
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // LOAD PRODUCTS
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/products");
      const raw = await res.text();

      if (!res.ok) {
        console.error("GET /api/products failed:", res.status, raw);
        throw new Error("Failed to load products from server.");
      }

      let data = [];
      if (raw && raw.trim().length > 0) {
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          console.error("Failed to parse /api/products JSON:", parseErr, raw);
          data = [];
        }
      }

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("loadProducts error:", err);
      setProducts([]);
      setStatus({
        type: "error",
        text: "Failed to load products. Check the server log for details.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate form inputs
  const validateForm = () => {
    if (!form.name || form.name.trim() === "") {
      setStatus({ type: "error", text: "Product name is required." });
      return false;
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      setStatus({ type: "error", text: "Price must be a valid number." });
      return false;
    }
    if (!form.stock || isNaN(parseInt(form.stock))) {
      setStatus({ type: "error", text: "Stock must be a valid number." });
      return false;
    }
    return true;
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Auto-dismiss status messages after a short time (lightweight toast)
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4200);
    return () => clearTimeout(t);
  }, [status]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // CREATE / UPDATE PRODUCT
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus(null);
    setSubmitting(true);

    const body = {
      name: form.name.trim(),
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
    };

    try {
      if (editingId) {
        // UPDATE
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, id: editingId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to update product.");
        }
        setStatus({ type: "success", text: "✓ Product updated successfully." });
      } else {
        // CREATE
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to add product.");
        }
        setStatus({ type: "success", text: "✓ Product added successfully." });
      }

      setForm({ name: "", price: "", stock: "" });
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      console.error("handleSubmit error:", err);
      setStatus({ type: "error", text: err.message || "Server error." });
    } finally {
      setSubmitting(false);
    }
  }

  // START EDITING
  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name ?? "",
      price: p.price_cents != null ? (p.price_cents / 100).toString() : "",
      stock: p.stock != null ? String(p.stock) : "",
    });
    setStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // DELETE PRODUCT
  async function deleteProduct(idFromRow) {
	const id = Number(idFromRow);

	if (isNaN(id) || id <= 0) {
	  console.error("deleteProduct invalid id:", idFromRow);
	  setStatus({ type: "error", text: "Invalid product id." });
	  return;
	}

    if (!confirm("🗑️ Delete this product? This cannot be undone.")) return;

    setDeletingId(id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product.");
      }

      setStatus({ type: "success", text: "✓ Product deleted." });
      await loadProducts();
    } catch (err) {
      console.error("deleteProduct error:", err);
      setStatus({
        type: "error",
        text: err.message || "Server error while deleting.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  // Derived stats
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const avgPrice =
    products.length === 0
      ? 0
      : products.reduce((sum, p) => sum + (p.price_cents || 0), 0) /
        products.length /
        100;

  // Filtered products
  const filtered = products.filter((p) => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return true;
    return (p.name || "").toLowerCase().includes(q);
  });

  return (
    <AuthGuard>
      <>
        <Nav />
        <div className="app-main container">
          {/* Header + stats */}
          <section className="page-section">
            <div className="page-header">
              <div>
                <h1 className="h1">Products</h1>
                <p className="h2">
                  Manage inventory stored in your MySQL database.
                </p>
              </div>
              <span className="pill blue">📊 Inventory overview</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total products</div>
                <div className="stat-value">{totalProducts}</div>
                <div className="stat-sub">
                  Items currently in your catalog.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total stock</div>
                <div className="stat-value">{totalStock}</div>
                <div className="stat-sub">
                  Units across all products.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Average price</div>
                <div className="stat-value">
                  ₱{avgPrice.toFixed(2)}
                </div>
                <div className="stat-sub">
                  Based on listed items.
                </div>
              </div>
            </div>
          </section>

          {/* Form + search */}
          <section className="page-section card">
            <div className="card-header">
              <div style={{ fontSize: 20 }}>{editingId ? "✏️" : "➕"}</div>
              <div>
                <h2 className="card-title">{editingId ? "Edit product" : "Add product"}</h2>
                <p className="card-sub">
                  {editingId
                    ? "Update product details and save changes."
                    : "Create a new product with price and stock."}
                </p>
              </div>
            </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "24px", marginTop: "18px", alignItems: "start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Product name *</label>
                  <input
                    className="input"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    placeholder="e.g. Premium Coffee Beans"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label>Stock quantity *</label>
                  <input
                    className="input"
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={onChange}
                    placeholder="e.g. 50"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label>Price (PHP) *</label>
                  <input
                    className="input"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={onChange}
                    placeholder="e.g. 199.00"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Search moved below the form — placed above the product list for clarity */}
            </form>

            <div className="form-actions">
              <button 
                className={`btn ${submitting ? "loading" : ""}`} 
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "" : editingId ? "💾 Save changes" : "➕ Add product"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", price: "", stock: "" });
                    setStatus(null);
                  }}
                  disabled={submitting}
                >
                  ✕ Cancel
                </button>
              )}
            </div>

            {status && (
              <div
                className={`msg ${
                  status.type === "error"
                    ? "error"
                    : status.type === "success"
                    ? "success"
                    : "info"
                }`}
                style={{ marginTop: 8 }}
              >
                {status.text}
              </div>
            )}
          </section>

          {/* Table */}
          <section className="page-section card">
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 6, color: "var(--muted)" }} htmlFor="product-search">Search products</label>
              <input
                id="product-search"
                className="input"
                placeholder="Filter by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 420 }}
              />
            </div>
            <div className="row" style={{ marginBottom: 6 }}>
              <h2 className="h1" style={{ fontSize: 18, margin: 0 }}>
                📋 Product list
              </h2>
              <span className="right small text-muted">
                Showing {filtered.length} of {products.length}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <div className="loading-spinner" style={{ margin: "0 auto 8px" }}></div>
                <p className="small">Loading products…</p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="small" style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                {search ? "No products match this search." : "No products yet. Create one to get started!"}
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price (PHP)</th>
                    <th>Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr 
                      key={p.id}
                      style={{
                        opacity: deletingId === p.id ? 0.5 : 1,
                        transition: "all 200ms ease",
                      }}
                    >
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>₱{formatPrice(p.price_cents)}</td>
                      <td>{p.stock}</td>
                      <td style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() => startEdit(p)}
                          disabled={deletingId !== null}
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </>
    </AuthGuard>
  );
}