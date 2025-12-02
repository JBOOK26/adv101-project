// app/api/sales/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.created_at, s.total_cents
       FROM sales s
       ORDER BY s.created_at DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/sales error:", err);
    return NextResponse.json(
      { error: "Failed to load sales." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const body = await req.json();
  const { items } = body; // [{ productId, quantity, price_cents }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "No sale items provided." },
      { status: 400 }
    );
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // compute total from items
    const totalCents = items.reduce(
      (sum, item) => sum + item.price_cents * item.quantity,
      0
    );

    // insert sale header
    const [saleResult] = await conn.execute(
      "INSERT INTO sales (total_cents) VALUES (?)",
      [totalCents]
    );
    const saleId = saleResult.insertId;

    // loop through items
    for (const item of items) {
      const productId = Number(item.productId);
      const qty = Number(item.quantity);
      const priceCents = Number(item.price_cents);

      if (!Number.isInteger(productId) || productId <= 0 || qty <= 0) {
        throw new Error("Invalid sale item data.");
      }

      // record the sale line
      await conn.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price_cents)
         VALUES (?, ?, ?, ?)`,
        [saleId, productId, qty, priceCents]
      );

      // check current stock
      const [rows] = await conn.execute(
        "SELECT stock FROM products WHERE id = ? FOR UPDATE",
        [productId]
      );

      if (rows.length === 0) {
        throw new Error(`Product ${productId} not found.`);
      }

      const currentStock = rows[0].stock ?? 0;
      const newStock = currentStock - qty;

      if (newStock < 0) {
        throw new Error(
          `Not enough stock for product ${productId}. Current: ${currentStock}, requested: ${qty}`
        );
      }

      // 👉 IMPORTANT PART:
      // If stock <= 0 => set stock = 0 AND soft-delete the product
      if (newStock <= 0) {
        await conn.execute(
          `UPDATE products
             SET stock = 0,
                 deleted_at = IF(deleted_at IS NULL, NOW(), deleted_at)
           WHERE id = ?`,
          [productId]
        );
      } else {
        await conn.execute(
          "UPDATE products SET stock = ? WHERE id = ?",
          [newStock, productId]
        );
      }
    }

    await conn.commit();
    return NextResponse.json({ ok: true, saleId });
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/sales error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record sale." },
      { status: 500 }
    );
  } finally {
    conn.release();
  }
}
