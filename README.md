# Archive 2k5 (build2 — UPI QR edition)

Full-stack thrift store: Next.js + database + admin dashboard (Clerk login).
Payments use **your UPI QR with manual confirmation** — zero fees, you stay in
control. Razorpay is fully built but dormant; flip one setting to switch later.

---

## How payment works now (UPI QR + manual confirm)

1. Buyer fills checkout → the item is **reserved** (nobody else can buy it).
2. They see your UPI QR (auto-made from your UPI ID) and pay in any UPI app.
3. They tap "I've paid."
4. YOU check your UPI app, see the money, and tap **"Confirm payment received"**
   in the admin Orders tab → the item becomes **SOLD**.
5. If they never pay, tap **"Release"** to put the item back up for sale.

No fees, ever. The only manual step is glancing at your phone and tapping confirm.

## Switching to Razorpay later (when you grow)

1. Complete Razorpay KYC, get live keys.
2. In `.env`: set `NEXT_PUBLIC_PAYMENT_MODE="razorpay"` and fill the Razorpay keys.
3. Redeploy. Done — checkout now auto-verifies payments. No code changes.

---

## Setup steps

### 1. Install Node.js (nodejs.org, LTS), then in this folder:
```
npm install
```

### 2. Get your Clerk keys (admin login) — dashboard.clerk.com
Configure → API Keys → copy Publishable + Secret key.

### 3. Add keys and configuration
```bash
cp .env.example .env
```
Open `.env` and fill in:
- Clerk keys (from dashboard.clerk.com)
- Your UPI ID (`NEXT_PUBLIC_UPI_ID`) and UPI Name (`NEXT_PUBLIC_UPI_NAME`)
- Your WhatsApp number (`NEXT_PUBLIC_WHATSAPP_NUMBER`) for payment confirmations.
Leave Razorpay keys blank for now. Leave `NEXT_PUBLIC_PAYMENT_MODE` as `upi_qr`.

### 5. Set up the database
```
npm run db:push
npm run db:seed   # optional sample items
```

### 6. Run it
```
npm run dev
```
- Shop: http://localhost:3002
- Admin: http://localhost:3002/admin  (sign in → that becomes your admin account)

---

## Your checklist
- [ ] Node.js installed
- [ ] npm install
- [ ] Clerk app → 2 keys → into .env
- [ ] Configure UPI & WhatsApp details in .env
- [ ] npm run db:push, then npm run dev
- [ ] Add items + photos in /admin
- [ ] (Later) Neon Postgres + deploy to Vercel (see notes below)

## Going live (later)
- Swap SQLite → Postgres: make a free DB at neon.tech, change `provider` in
  prisma/schema.prisma to "postgresql", set DATABASE_URL, run `npm run db:push`.
- Deploy: push to GitHub → import to vercel.com → add .env values → deploy.

## Images
Add an item with an Image URL (free host: cloudinary.com — upload, copy URL, paste).

Stuck? Paste the exact error and I'll walk you through it.
