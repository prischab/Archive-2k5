import { prisma } from "@/lib/prisma";
import { ZONES } from "@/lib/zones";
import { NextResponse } from "next/server";

// UPI flow: buyer submits details, we create PENDING orders and "reserve" the
// items so nobody else can buy them while this person pays. The items are NOT yet
// "sold" — they become sold only when YOU confirm payment in the admin panel.
// If a buyer never pays, you can release the reservation from admin.
export async function POST(req) {
  try {
    const { productIds, buyer, deliveryMethod, zoneIndex, address } = await req.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "No products in cart" }, { status: 400 });
    }

    // Fetch all products
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some items were not found" }, { status: 404 });
    }

    // Check if any product is not available
    const unavailable = products.filter((p) => p.status !== "available");
    if (unavailable.length > 0) {
      const names = unavailable.map((p) => p.title).join(", ");
      return NextResponse.json({ error: `Some items in your cart are already reserved or sold: ${names}` }, { status: 409 });
    }

    const shipping = deliveryMethod === "courier" ? (ZONES[zoneIndex]?.fee ?? 0) : 0;
    const productsTotal = products.reduce((acc, p) => acc + p.price, 0);
    const total = productsTotal + shipping;

    // Grouped order identifier
    const cartGroupId = "cart_" + Math.random().toString(36).substring(2, 10);

    // Create database actions inside a transaction
    const transactionActions = [];
    
    // Mark products as reserved
    for (const p of products) {
      transactionActions.push(
        prisma.product.update({ where: { id: p.id }, data: { status: "reserved" } })
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
            paymentStatus: "pending",
            status: "pending",
            paymentMode: "upi_qr",
            upiRef: cartGroupId,
          },
        })
      );
    }

    await prisma.$transaction(transactionActions);

    return NextResponse.json({ orderId: cartGroupId, total });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
