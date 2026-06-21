// Run with: npm run db:seed  — adds a few sample items so the shop isn't empty.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      { title: "Faded Levi's 501 Straight", price: 850, brand: "Levi's", category: "Bottoms", size: "30", condition: "Great", wornTimes: "5–10 times", color: "Washed indigo", waist: "30 in", length: "40 in", description: "Vintage straight leg, broken in perfectly." },
      { title: "Oversized Wool Cardigan", price: 1200, brand: "Uniqlo", category: "Tops", size: "M / L", condition: "Like new", wornTimes: "2–3 times", color: "Oatmeal", chest: "44 in", length: "28 in", description: "Cozy chunky knit, basically new." },
      { title: "Floral Summer Dress", price: 650, brand: "Zara", category: "Dresses", size: "S", condition: "Like new", wornTimes: "Once", color: "Cream + red florals", bust: "34 in", length: "36 in", description: "Worn once, flowy midi, side zip." },
    ],
  });
  console.log("Seeded ✓");
}
main().finally(() => prisma.$disconnect());
