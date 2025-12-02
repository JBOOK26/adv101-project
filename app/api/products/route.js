// app/api/products/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/products
 * Fetch all products from the database
 */
export async function GET(request) {
  try {
    // Only return products with stock > 0
    const [rows] = await pool.query("SELECT * FROM products WHERE stock > 0 ORDER BY id ASC");
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, price, stock } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const priceNumber = Number(price) || 0;
    const stockNumber = Number(stock) || 0;

    // Convert price to cents (assuming input is in PHP)
    const priceCents = Math.round(priceNumber * 100);

    const [result] = await pool.query(
      "INSERT INTO products (name, price_cents, stock) VALUES (?, ?, ?)",
      [name.trim(), priceCents, stockNumber]
    );

    return NextResponse.json(
      { id: result.insertId, name, price_cents: priceCents, stock: stockNumber },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products
 * Update an existing product (expects id in body)
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, price, stock } = body;

    // Validate id
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      return NextResponse.json(
        { error: "Invalid product id" },
        { status: 400 }
      );
    }

    // Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const priceNumber = Number(price) || 0;
    const stockNumber = Number(stock) || 0;
    const priceCents = Math.round(priceNumber * 100);

    const [result] = await pool.query(
      "UPDATE products SET name = ?, price_cents = ?, stock = ? WHERE id = ?",
      [name.trim(), priceCents, stockNumber, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id,
      name,
      price_cents: priceCents,
      stock: stockNumber,
    });
  } catch (err) {
    console.error("PUT /api/products error:", err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
