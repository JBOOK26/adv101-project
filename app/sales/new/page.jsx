"use client";

import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import AuthGuard from "../../components/AuthGuard";

function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

export default function RecordSalePage() {
  const [products, setProducts] = useState([]);
  const [qty, setQty] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load products");
      setProducts(data);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: "Could not load products." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function changeQty(id, value) {
    const num = Number(value);
    if (Number.isNaN(num) || num < 0) return;
    setQty({ ...qty, [id]: value });
  }

  const selectedItems = products
    .map((p) => {
      const count = Number(qty[p.id] || 0);
      return {
        ...p,
        quantity: count,
        lineTotal: count * p.price_cents,
      };
    })
    .filter((p) => p.quantity > 0);

  const totalCents = selectedItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0
  );

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    const items = selectedItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      price_cents: item.price_cents,
    }));

    if (items.length === 0) {
      return setStatus({
        type: "error",
        text: "Enter quantity for at least one product.",
      });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;
      if (item.quantity > product.stock) {
        return setStatus({
          type: "error",
          text: `Quantity for "${product.name}" exceeds stock (${product.stock}).`,
        });
      }
    }

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok) {
        return setStatus({
          type: "error",
          text: data.error || "Failed to record sale.",
        });
      }

      setStatus({
        type: "success",
        text: `Sale recorded. Total: ₱${formatPrice(data.total_cents)}`,
      });
      setQty({});
      await loadProducts();
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        text: "Server error while recording sale.",
      });
    }
  }

  return (
    <AuthGuard>
      <>
        <Nav />
        <div className="app-main">
          <section className="page-section">
            <div className="page-header">
              <div>
                <h1 className="h1">Record sale</h1>
                <p className="h2">
                  Select quantities and confirm. Stock updates are stored in
                  MySQL.
                </p>
              </div>
              <span className="pill green">
                Live total: ₱{formatPrice(totalCents)}
              </span>
            </div>
          </section>

          <section className="page-section card">
            {loading ? (
              <p className="small">Loading products…</p>
            ) : products.length === 0 ? (
              <p className="small">
                No products available. Add products first on the Products page.
              </p>
            ) : (
              <form onSubmit={submit} className="stack">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price (PHP)</th>
                      <th>Stock</th>
                      <th>Qty</th>
                      <th>Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const quantity = Number(qty[p.id] || 0);
                      const lineTotal = quantity * p.price_cents;
                      return (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td>₱{formatPrice(p.price_cents)}</td>
                          <td>{p.stock}</td>
                          <td>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              max={p.stock}
                              style={{ maxWidth: 80 }}
                              value={qty[p.id] ?? ""}
                              onChange={(e) =>
                                changeQty(p.id, e.target.value)
                              }
                            />
                          </td>
                          <td>₱{formatPrice(lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="row">
                  <button className="btn" type="submit">
                    Confirm sale
                  </button>
                  <span className="right small text-muted">
                    Total amount: ₱{formatPrice(totalCents)}
                  </span>
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
                  >
                    {status.text}
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </>
    </AuthGuard>
  );
}
