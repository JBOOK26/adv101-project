import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/sales/:id – sale details
export async function GET(request, context) {
  try {
    const { params } = context || {};
    let idRaw = params?.id;

    // Fallback: try to parse id from request URL if params missing
    if (!idRaw) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);
        idRaw = parts[parts.length - 1];
      } catch (e) {
        // ignore
      }
    }

    const saleId = parseInt(idRaw, 10);

    if (isNaN(saleId) || saleId <= 0) {
      console.error("GET sale details invalid id:", idRaw, "(parsed:", saleId, ")");
      return NextResponse.json({ error: "Invalid sale id" }, { status: 400 });
    }

    const [rows] = await pool.query(
      "SELECT id, total_cents, created_at FROM sales WHERE id = ?",
      [saleId]
    );

    const sale = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!sale)
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    // Use LEFT JOIN so that items remain visible even if product was soft-deleted
    const [items] = await pool.query(
      `SELECT si.quantity, si.price_cents, COALESCE(p.name, '(deleted)') AS name
       FROM sale_items si
       LEFT JOIN products p ON si.product_id = p.id
       WHERE si.sale_id = ?`,
      [saleId]
    );

    return NextResponse.json({ sale, items });
  } catch (err) {
    console.error("GET sale details error:", err);
    return NextResponse.json(
      { error: "Failed to load sale details" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/:id – delete sale
export async function DELETE(request, context) {
  try {
    const { params } = context || {};
    let idRaw = params?.id;
    if (!idRaw) {
      try {
        const url = new URL(request.url);
        const parts = url.pathname.split("/").filter(Boolean);
        idRaw = parts[parts.length - 1];
      } catch (e) {}
    }
    const saleId = parseInt(idRaw, 10);
    if (isNaN(saleId) || saleId <= 0) {
      console.error("DELETE sale invalid id:", idRaw, "(parsed:", saleId, ")");
      return NextResponse.json({ error: "Invalid sale id" }, { status: 400 });
    }

    await pool.query("DELETE FROM sale_items WHERE sale_id = ?", [saleId]);
    const [result] = await pool.query("DELETE FROM sales WHERE id = ?", [saleId]);

    if (result && result.affectedRows === 0) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Sale deleted" });
  } catch (err) {
    console.error("DELETE sale error:", err);
    return NextResponse.json(
      { error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
