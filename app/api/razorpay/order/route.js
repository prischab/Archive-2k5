import Razorpay from "razorpay";
import { prisma } from "@/lib/prisma";
import { ZONES } from "@/lib/zones";
import { NextResponse } from "next/server";

// Step 1 of payment: client asks us to create a Razorpay order for the real total.
// We compute the amount on the SERVER (never trust the price the browser sends)
// so nobody can pay ₹1 for a ₹1200 item.
export async function POST(req) {
  try {
    const body = await req.json();
    const { productIds, deliveryMethod, zoneIndex } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "No products in cart" }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some items were not found" }, { status: 404 });
    }

    const unavailable = products.filter((p) => p.status === "sold");
    if (unavailable.length > 0) {
      const names = unavailable.map((p) => p.title).join(", ");
      return NextResponse.json({ error: `Some items are already sold: ${names}` }, { status: 409 });
    }

    const shipping =
      deliveryMethod === "courier" ? (ZONES[zoneIndex]?.fee ?? 0) : 0;
    const productsTotal = products.reduce((acc, p) => acc + p.price, 0);
    const total = productsTotal + shipping;

    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await rzp.orders.create({
      amount: total * 100, // Razorpay works in paise
      currency: "INR",
      notes: { productIds: productIds.join(","), titles: products.map((p) => p.title).join(", ") },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: total,
      shipping,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not create order" }, { status: 500 });
  }
}
