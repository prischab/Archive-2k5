import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { ZONES } from "@/lib/zones";
import { NextResponse } from "next/server";

// Step 2 of payment: after the buyer pays, Razorpay sends back a signature.
// We re-create that signature with our SECRET key and compare. If it matches,
// the payment is genuinely real — only THEN do we mark the item sold and save
// the order. This is what stops fake "I paid" claims and double-selling.
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      productIds,
      buyer, // { name, phone, email }
      deliveryMethod,
      zoneIndex,
      address,
    } = body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some items were not found" }, { status: 404 });
    }
    const unavailable = products.filter((p) => p.status === "sold");
    if (unavailable.length > 0)
      return NextResponse.json({ error: "Some items in your cart are already sold" }, { status: 409 });

    const shipping =
      deliveryMethod === "courier" ? (ZONES[zoneIndex]?.fee ?? 0) : 0;

    const transactionActions = [];
    
    // Mark products as sold
    for (const p of products) {
      transactionActions.push(
        prisma.product.update({ where: { id: p.id }, data: { status: "sold" } })
      );
    }

    // Create orders for each product
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const itemShipping = i === 0 ? shipping : 0;
      const itemTotal = p.price + itemShipping;

      transactionActions.push(
        prisma.order.create({
          data: {
            productId: p.id,
            buyerName: buyer.name,
            buyerPhone: buyer.phone,
            buyerEmail: buyer.email,
            deliveryMethod,
            zoneName: deliveryMethod === "courier" ? ZONES[zoneIndex]?.name : null,
            address: deliveryMethod === "courier" ? address : null,
            shippingFee: itemShipping,
            total: itemTotal,
            razorpayId: razorpay_payment_id,
            paymentStatus: "paid",
            status: "paid",
            paymentMode: "razorpay",
          },
        })
      );
    }

    await prisma.$transaction(transactionActions);

    return NextResponse.json({ success: true, orderId: razorpay_payment_id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification error" }, { status: 500 });
  }
}
