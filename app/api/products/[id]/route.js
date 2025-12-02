// app/api/products/[id]/route.js
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// OPTIONAL: if you have auth helpers, you can import and use them here
// import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(request, context) {
  try {
    // ✅ Correct way to get route params in Next.js app router
    const { params } = context || {};
    const idRaw = params?.id;

    console.log("DELETE /api/products/[id] raw params.id =", idRaw);

    const id = Number(idRaw);

    if (!Number.isInteger(id) || id <= 0) {
      console.error("DELETE /products invalid id value:", idRaw);
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // If you want to be extra safe you can also check if product exists first:
    // const [rows] = await pool.query("SELECT id FROM products WHERE id = ?", [id]);
    // if (rows.length === 0) {
    //   return NextResponse.json({ error: "Product not found" }, { status: 404 });
    // }

    const [result] = await pool.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    console.log("DELETE /api/products/[id] result:", result);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/products/[id] error:", err);
    return NextResponse.json(
      { error: "Server error while deleting product" },
      { status: 500 }
    );
  }
}