"use client";

import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import AuthGuard from "../components/AuthGuard";

function formatMoney(cents) {
  return (cents / 100).toFixed(2);
}

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);

  async function loadSales() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load sales");
      setSales(data);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Could not load sales." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  // Auto-dismiss status messages after a short time
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4200);
    return () => clearTimeout(t);
  }, [status]);

  async function viewDetails(id) {
    // Toggle: if the same sale is already selected, collapse it
    if (selectedSale && selectedSale.sale && selectedSale.sale.id === id) {
      setSelectedSale(null);
      return;
    }

    setSelectedSale(null);
    try {
      setStatus(null);
      const res = await fetch(`/api/sales/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || `Failed to load details (status ${res.status})`;
        console.error("viewDetails failed:", msg, { id, data });
        throw new Error(msg);
      }

      // Ensure shape: { sale, items }
      if (!data || !data.sale) {
        console.error("viewDetails: invalid payload", { id, data });
        throw new Error(data?.error || "Invalid sale data received from server.");
      }

      setSelectedSale({ sale: data.sale, items: Array.isArray(data.items) ? data.items : [] });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "Could not load sale details." });
    }
  }

  async function deleteSale(id) {
    if (!confirm("Delete this sale? This will remove its items too.")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete sale");

      setStatus({ type: "success", text: "Sale deleted." });
      setSelectedSale(null);
      await loadSales();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "Server error while deleting." });
    }
  }

  const totalSales = sales.length;
  const totalRevenue = sales.reduce(
    (sum, s) => sum + (s.total_cents ?? 0),
    0
  );
  const totalItems = sales.reduce(
    (sum, s) => sum + (s.total_items ?? 0),
    0
  );

  return (
    <AuthGuard>
      <>
        <Nav />
        <div className="app-main">
          <section className="page-section">
            <div className="page-header">
              <div>
                <h1 className="h1">Sales</h1>
                <p className="h2">
                  Overview of recorded sales from your MySQL database.
                </p>
              </div>
              <span className="pill">
                History &amp; details
              </span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Total sales</div>
                <div className="stat-value">{totalSales}</div>
                <div className="stat-sub">
                  Completed sales transactions.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total items sold</div>
                <div className="stat-value">{totalItems}</div>
                <div className="stat-sub">
                  Sum of all quantities.
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total revenue</div>
                <div className="stat-value">
                  ₱{formatMoney(totalRevenue)}
                </div>
                <div className="stat-sub">
                  Based on recorded sales.
                </div>
              </div>
            </div>
          </section>

          <section className="page-section card">
            {status && (
              <div
                className={`msg ${
                  status.type === "error"
                    ? "error"
                    : status.type === "success"
                    ? "success"
                    : "info"
                }`}
                style={{ marginBottom: 10 }}
              >
                {status.text}
              </div>
            )}

            {loading ? (
              <p className="small">Loading sales…</p>
            ) : sales.length === 0 ? (
              <p className="small">No sales recorded yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total (PHP)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>
                        {new Date(s.created_at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>{s.total_items ?? 0}</td>
                      <td>₱{formatMoney(s.total_cents)}</td>
                      <td>
                        <button
                          className="btn ghost"
                          type="button"
                          onClick={() => viewDetails(s.id)}
                          style={{ marginRight: 6 }}
                        >
                          {selectedSale && selectedSale.sale && selectedSale.sale.id === s.id ? "Hide" : "Details"}
                        </button>
                        <button
                          className="btn secondary"
                          type="button"
                          onClick={() => deleteSale(s.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedSale && (
              <div style={{ marginTop: 18 }}>
                <div className="row">
                  <h2
                    className="h1"
                    style={{ fontSize: 18, margin: 0 }}
                  >
                    Sale #{selectedSale.sale.id} details
                  </h2>
                  <span className="right pill green">
                    ₱{formatMoney(selectedSale.sale.total_cents)}
                  </span>
                </div>
                <p className="small text-muted">
                  {new Date(
                    selectedSale.sale.created_at
                  ).toLocaleString()}
                </p>

                <table className="table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price (PHP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>₱{formatMoney(item.price_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </>
    </AuthGuard>
  );
}
