import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET = all orders, newest first. Admin only — your tracking view.
export async function GET() {
  const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let userId;
  if (isDummy) {
    userId = "dev_admin_user";
  } else {
    const authObj = await auth();
    userId = authObj.userId;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });
  return NextResponse.json(orders);
}

// PATCH = admin actions on an order. Admin only.
//   action "confirm-payment" -> mark money received (pending -> paid)
//   action "release"         -> buyer never paid; free the item to sell again
//   action "status"          -> advance fulfilment (booked / delivered)
export async function PATCH(req) {
  const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let userId;
  if (isDummy) {
    userId = "dev_admin_user";
  } else {
    const authObj = await auth();
    userId = authObj.userId;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action, status } = await req.json();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const isUpiGroup = order.upiRef && order.upiRef.startsWith("cart_");
  const isRzpGroup = !!order.razorpayId;
  const isGroup = isUpiGroup || isRzpGroup;
  const groupFilter = isUpiGroup ? { upiRef: order.upiRef } : { razorpayId: order.razorpayId };

  if (action === "confirm-payment") {
    if (isGroup) {
      const orders = await prisma.order.findMany({ where: groupFilter });
      const actions = [];
      for (const o of orders) {
        if (o.paymentStatus === "pending") {
          actions.push(
            prisma.product.update({ where: { id: o.productId }, data: { status: "sold" } }),
            prisma.order.update({ where: { id: o.id }, data: { paymentStatus: "paid", status: "paid" } })
          );
        }
      }
      if (actions.length > 0) await prisma.$transaction(actions);
      return NextResponse.json({ success: true });
    } else {
      const [, updated] = await prisma.$transaction([
        prisma.product.update({ where: { id: order.productId }, data: { status: "sold" } }),
        prisma.order.update({
          where: { id },
          data: { paymentStatus: "paid", status: "paid" },
        }),
      ]);
      return NextResponse.json(updated);
    }
  }

  if (action === "release") {
    if (isGroup) {
      const orders = await prisma.order.findMany({ where: groupFilter });
      const actions = [];
      for (const o of orders) {
        if (o.paymentStatus === "pending") {
          actions.push(
            prisma.product.update({ where: { id: o.productId }, data: { status: "available" } }),
            prisma.order.update({ where: { id: o.id }, data: { paymentStatus: "cancelled", status: "cancelled" } })
          );
        }
      }
      if (actions.length > 0) await prisma.$transaction(actions);
      return NextResponse.json({ success: true });
    } else {
      const [, cancelled] = await prisma.$transaction([
        prisma.product.update({ where: { id: order.productId }, data: { status: "available" } }),
        prisma.order.update({ where: { id }, data: { paymentStatus: "cancelled", status: "cancelled" } }),
      ]);
      return NextResponse.json(cancelled);
    }
  }

  // default: advance fulfilment status (paid -> booked -> delivered)
  if (isGroup) {
    await prisma.order.updateMany({
      where: groupFilter,
      data: { status },
    });
    return NextResponse.json({ success: true });
  } else {
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  }
}
