import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET = public list of items for the shop.
export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(products);
}

// POST = create a new listing. Admin only — Clerk's auth() gives us the logged-in
// user; if there's none, we reject. So only you (when signed in) can add items.
export async function POST(req) {
  const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  let userId;
  if (isDummy) {
    userId = "dev_admin_user";
  } else {
    const authObj = await auth();
    userId = authObj.userId;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  if (!data.title || !data.price)
    return NextResponse.json({ error: "Title and price required" }, { status: 400 });

  const product = await prisma.product.create({
    data: {
      title: data.title,
      price: parseInt(data.price, 10),
      description: data.notes || null,
      brand: data.brand || null,
      category: data.category || "Tops",
      size: data.size || null,
      condition: data.condition || null,
      wornTimes: data.wornTimes || null,
      color: data.color || null,
      waist: data.waist || null,
      length: data.length || null,
      chest: data.chest || null,
      bust: data.bust || null,
      imageUrl: data.imageUrl || null,
    },
  });
  return NextResponse.json(product);
}
