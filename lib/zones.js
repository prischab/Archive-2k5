// Pune-only courier zones. Edit fees/areas freely — this is your shipping logic.
// Keeping the store Pune-only is simply a matter of only offering these options.
export const ZONES = [
  { name: "Central (Camp, Shivajinagar, Deccan)", fee: 60 },
  { name: "West (Kothrud, Baner, Aundh, Bavdhan)", fee: 90 },
  { name: "East (Kharadi, Viman Nagar, Hadapsar)", fee: 110 },
  { name: "PCMC / Outer (Wakad, Hinjewadi, Pimpri)", fee: 150 },
];

export const CATEGORIES = ["Tops", "Bottoms", "Dresses"];

// ─── PAYMENT SETTINGS ───────────────────────────────────────
// "upi_qr"   = show your UPI QR, you confirm payment manually (no fees). ACTIVE NOW.
// "razorpay" = automatic Razorpay checkout (flip to this when you grow).
//
// To switch later: set NEXT_PUBLIC_PAYMENT_MODE="razorpay" in .env, add your
// Razorpay keys, redeploy. No code changes needed — Razorpay flow is already built.
export const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || "upi_qr";

// Your UPI details — used to build the payment QR.
export const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || "your-upi-id@bank";
export const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || "Your Name"; // name shown in the buyer's payment app

// Your WhatsApp number (country code + number, no + or spaces) for payment proof.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "911234567890";
