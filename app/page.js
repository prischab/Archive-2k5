"use client";
import { useState, useEffect, useMemo } from "react";
import { ZONES, PAYMENT_MODE, UPI_ID, UPI_NAME, WHATSAPP_NUMBER } from "@/lib/zones";

// Storefront. Checkout uses UPI QR + manual confirm (PAYMENT_MODE="upi_qr").
// Flip PAYMENT_MODE to "razorpay" later and the Razorpay branch takes over.
const FD = "'Fraunces',Georgia,serif", FB = "'Spline Sans',system-ui,sans-serif", FM = "'Spline Sans Mono',monospace";
const C = { paper: "#F4EDE2", paper2: "#EFE6D8", ink: "#1A1714", coral: "#E8503A", sage: "#7C8C6B", line: "#1A171420" };

export default function Shop() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("shop");
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("All");
  const [order, setOrder] = useState(null);
  const [reservedPopup, setReservedPopup] = useState(null); // holds the reserved item
  const [cart, setCart] = useState([]);

  useEffect(() => { load(); }, []);
  // Keep the shop fresh: re-check stock every 20s so reserved/sold show up
  // without the shopper needing to refresh the page.
  useEffect(() => {
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);
  function load() { fetch("/api/products").then((r) => r.json()).then(setItems); }

  // Load cart from local storage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
  };

  const addToCart = (item) => {
    if (cart.some((i) => i.id === item.id)) {
      setView("cart");
      return;
    }
    const newCart = [...cart, item];
    saveCart(newCart);
    setView("cart");
  };

  const removeFromCart = (id) => {
    const newCart = cart.filter((i) => i.id !== id);
    saveCart(newCart);
  };

  const buyNow = (item) => {
    if (!cart.some((i) => i.id === item.id)) {
      saveCart([...cart, item]);
    }
    setView("checkout");
  };

  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const shown = useMemo(() => items.filter((i) => filter === "All" || i.category === filter), [items, filter]);

  function handleOpen(it) {
    if (it.status === "available") { setActive(it); setView("detail"); }
    else if (it.status === "reserved") setReservedPopup(it);
  }

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: FB }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Spline+Sans:wght@400;500;600&family=Spline+Sans+Mono&display=swap');*{box-sizing:border-box}.card{transition:transform .35s,box-shadow .35s}.card:hover{transform:translateY(-6px) rotate(-.6deg);box-shadow:10px 14px 0 ${C.ink}}`}</style>
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: C.paper, borderBottom: `2px solid ${C.ink}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div onClick={() => setView("shop")} style={{ cursor: "pointer" }}>
          <span style={{ fontFamily: FD, fontWeight: 900, fontSize: 26 }}>Archive </span>
          <span style={{ fontFamily: FM, fontWeight: 700, fontSize: 24, letterSpacing: 1, color: C.coral }}>2K5</span>
        </div>
        <button onClick={() => setView("cart")} style={{ background: "none", border: `2px solid ${C.ink}`, padding: "8px 16px", cursor: "pointer", fontFamily: FM, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: C.ink, background: view === "cart" ? C.ink : "transparent", color: view === "cart" ? C.paper : C.ink, transition: "background 0.2s, color 0.2s" }}>
          Cart ({cart.length})
        </button>
      </header>

      {view === "shop" && <Grid items={shown} cats={cats} filter={filter} setFilter={setFilter} open={handleOpen} />}
      {view === "detail" && <Detail item={active} back={() => setView("shop")} addToCart={addToCart} buyNow={buyNow} />}
      {view === "cart" && <CartView cart={cart} removeFromCart={removeFromCart} checkout={() => setView("checkout")} keepShopping={() => setView("shop")} />}
      {view === "checkout" && <Checkout cart={cart} back={() => setView("cart")} done={(o) => { saveCart([]); setOrder(o); load(); setView("done"); }} />}
      {view === "done" && <Done order={order} home={() => { load(); setView("shop"); }} />}

      {reservedPopup && <ReservedPopup item={reservedPopup} close={() => setReservedPopup(null)} />}

      <footer style={{ borderTop: `2px solid ${C.ink}`, padding: "28px 20px", marginTop: 60, fontFamily: FM, fontSize: 12 }}>
        PUNE ONLY · PICKUP OR LOCAL COURIER
      </footer>
    </div>
  );
}

// Popup shown when a shopper taps an item someone else is mid-buying.
function ReservedPopup({ item, close }) {
  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, background: "#1A1714AA", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.paper, border: `2px solid ${C.ink}`, boxShadow: `8px 9px 0 ${C.coral}`, maxWidth: 360, padding: 26, textAlign: "center" }}>
        <div style={{ fontFamily: FM, fontSize: 11, letterSpacing: 2, color: C.coral }}>⏳ RESERVED</div>
        <h2 style={{ fontFamily: FD, fontWeight: 900, fontSize: 24, margin: "10px 0" }}>{item.title} is reserved</h2>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>
          Someone's in the middle of buying this one. It might come back if they don't complete payment — check back in a little while!
        </p>
        <button onClick={close} style={{ marginTop: 16, padding: "12px 24px", fontFamily: FM, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, cursor: "pointer" }}>
          Got it
        </button>
      </div>
    </div>
  );
}

function Grid({ items, cats, filter, setFilter, open }) {
  return (
    <div>
      <section style={{ padding: "44px 20px 26px" }}>
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: "clamp(38px,7vw,76px)", lineHeight: .95, margin: 0 }}>
          Pre-loved clothes,<br /><span style={{ color: C.coral, fontStyle: "italic", fontWeight: 600 }}>picked with love.</span>
        </h1>
      </section>
      <div style={{ padding: "0 20px 6px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{ fontFamily: FM, fontSize: 12, padding: "7px 13px", borderRadius: 999, border: `2px solid ${C.ink}`, cursor: "pointer", background: filter === c ? C.ink : "transparent", color: filter === c ? C.paper : C.ink }}>{c}</button>
        ))}
      </div>
      <div style={{ display: "grid", gap: 22, padding: 20, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))" }}>
        {items.map((it) => (
          <article key={it.id} className="card" onClick={() => it.status !== "sold" && open(it)} style={{ border: `2px solid ${C.ink}`, background: C.paper2, cursor: it.status === "sold" ? "default" : "pointer", boxShadow: `5px 6px 0 ${C.ink}`, opacity: it.status === "sold" ? .55 : 1 }}>
            <div style={{ height: 230, background: it.imageUrl ? `center/cover url(${it.imageUrl})` : "linear-gradient(135deg,#c9b79c,#e9dcc4)", borderBottom: `2px solid ${C.ink}`, position: "relative" }}>
              {it.status === "sold" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><span style={{ fontFamily: FD, fontWeight: 900, fontSize: 34, color: C.paper, transform: "rotate(-8deg)", border: `3px solid ${C.paper}`, padding: "4px 16px" }}>SOLD</span></div>}
              {it.status === "reserved" && <div style={{ position: "absolute", top: 10, right: 10, fontFamily: FM, fontSize: 10, letterSpacing: 1, background: C.coral, color: C.paper, padding: "4px 8px", border: `1.5px solid ${C.ink}` }}>⏳ RESERVED</div>}
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <h3 style={{ fontFamily: FD, fontWeight: 600, fontSize: 18, margin: 0 }}>{it.title}</h3>
                <span style={{ fontFamily: FM }}>₹{it.price}</span>
              </div>
              <div style={{ marginTop: 8, fontFamily: FM, fontSize: 11, opacity: .7 }}>{it.brand} · {it.condition}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Detail({ item, back, addToCart, buyNow }) {
  const specs = [["Brand", item.brand], ["Condition", item.condition], ["Worn", item.wornTimes], ["Size", item.size], ["Color", item.color], ["Waist", item.waist], ["Length", item.length], ["Chest", item.chest], ["Bust", item.bust]].filter(([, v]) => v);
  return (
    <div style={{ padding: 20 }}>
      <button onClick={back} style={{ fontFamily: FM, fontSize: 12, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginBottom: 16 }}>← back</button>
      <div style={{ display: "grid", gap: 30, gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
        <div style={{ height: 440, background: item.imageUrl ? `center/cover url(${item.imageUrl})` : "linear-gradient(135deg,#c9b79c,#e9dcc4)", border: `2px solid ${C.ink}`, boxShadow: `8px 9px 0 ${C.ink}` }} />
        <div>
          <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 40, margin: 0 }}>{item.title}</h1>
          <div style={{ fontFamily: FM, fontSize: 24, marginTop: 10, color: C.coral }}>₹{item.price}</div>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>{item.description}</p>
          <div style={{ border: `2px solid ${C.ink}`, background: C.paper2, marginTop: 16 }}>
            {specs.map(([k, v], i) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: i < specs.length - 1 ? `1px solid ${C.line}` : "none" }}><span style={{ fontFamily: FM, fontSize: 12, opacity: .7 }}>{k}</span><span>{v}</span></div>)}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <button onClick={() => addToCart(item)} style={{ flex: 1, padding: 16, fontFamily: FM, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", background: "transparent", color: C.ink, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, cursor: "pointer" }}>Add to Cart</button>
            <button onClick={() => buyNow(item)} style={{ flex: 1, padding: 16, fontFamily: FM, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", background: C.coral, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, cursor: "pointer" }}>Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartView({ cart, removeFromCart, checkout, keepShopping }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
      <button onClick={keepShopping} style={{ fontFamily: FM, fontSize: 12, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", marginBottom: 16 }}>← keep shopping</button>
      <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 34, margin: "0 0 20px 0" }}>Your Cart</h1>

      {cart.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: 16, marginBottom: 20 }}>Your cart is empty. Fill it with pre-loved gems!</p>
          <button onClick={keepShopping} style={{ padding: "14px 28px", fontFamily: FM, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, cursor: "pointer", boxShadow: `5px 5px 0 ${C.coral}` }}>Explore Shop</button>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: 16, border: `2px solid ${C.ink}`, background: C.paper2, padding: 14, boxShadow: `4px 4px 0 ${C.ink}` }}>
                <div style={{ width: 80, height: 80, background: item.imageUrl ? `center/cover url(${item.imageUrl})` : "linear-gradient(135deg,#c9b79c,#e9dcc4)", border: `2px solid ${C.ink}`, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ fontFamily: FD, fontWeight: 600, fontSize: 17, margin: 0 }}>{item.title}</h3>
                      <span style={{ fontFamily: FM, fontSize: 14 }}>₹{item.price}</span>
                    </div>
                    <div style={{ fontFamily: FM, fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                      {item.brand && `${item.brand} · `}Size {item.size || "Free"} · {item.condition}
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ alignSelf: "flex-start", background: "none", border: "none", color: C.coral, textDecoration: "underline", fontSize: 11, fontFamily: FM, cursor: "pointer", padding: 0 }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 16, marginBottom: 20, fontFamily: FM }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 600 }}>
              <span>Subtotal</span>
              <span style={{ color: C.coral }}>₹{subtotal}</span>
            </div>
            <p style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>Shipping calculated at checkout. Multiple items ship together for a single flat fee.</p>
          </div>

          <button onClick={checkout} style={{ width: "100%", padding: 16, fontFamily: FM, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", background: C.coral, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, cursor: "pointer" }}>
            Proceed to Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

function Checkout({ cart, back, done }) {
  const [d, setD] = useState({ name: "", phone: "", email: "", method: "pickup", zone: 0, address: "" });
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("form"); // form | pay  (pay = UPI QR shown)
  const [orderId, setOrderId] = useState(null);
  const set = (k) => (e) => setD((p) => ({ ...p, [k]: e.target.value }));
  const shipping = d.method === "pickup" ? 0 : ZONES[d.zone].fee;
  
  const itemsPrice = cart.reduce((sum, item) => sum + item.price, 0);
  const total = itemsPrice + shipping;
  
  const valid = d.name && /^[6-9]\d{9}$/.test(d.phone) && d.email.includes("@") && (d.method === "pickup" || d.address.trim().length > 6);

  const titlesList = cart.map((i) => i.title).join(", ");
  const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent("Thrift: " + titlesList.slice(0, 50))}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiString)}`;

  async function placeUpiOrder() {
    setBusy(true);
    const res = await fetch("/api/upi-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cart.map((i) => i.id), buyer: { name: d.name, phone: d.phone, email: d.email }, deliveryMethod: d.method, zoneIndex: d.zone, address: d.address }),
    });
    const o = await res.json();
    setBusy(false);
    if (!res.ok) { alert(o.error); return; }
    setOrderId(o.orderId);
    setStage("pay");
  }

  async function payRazorpay() {
    setBusy(true);
    const res = await fetch("/api/razorpay/order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: cart.map((i) => i.id), deliveryMethod: d.method, zoneIndex: d.zone }),
    });
    const o = await res.json();
    if (!res.ok) { alert(o.error); setBusy(false); return; }
    const rzp = new window.Razorpay({
      key: o.keyId, amount: o.amount * 100, currency: "INR", name: "Archive 2k5", order_id: o.orderId,
      prefill: { name: d.name, email: d.email, contact: d.phone }, theme: { color: "#E8503A" },
      handler: async (resp) => {
        const v = await fetch("/api/razorpay/verify", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...resp, productIds: cart.map((i) => i.id), buyer: { name: d.name, phone: d.phone, email: d.email }, deliveryMethod: d.method, zoneIndex: d.zone, address: d.address }),
        });
        if (v.ok) done({ ...d, items: cart, total, zoneName: d.method === "courier" ? ZONES[d.zone].name : null });
        else alert("Payment verification failed");
        setBusy(false);
      },
      modal: { ondismiss: () => setBusy(false) },
    });
    rzp.open();
  }

  if (stage === "pay") {
    return (
      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 30 }}>Scan & pay ₹{total}</h1>
        <p style={{ fontSize: 15, lineHeight: 1.5 }}>Your items are reserved for you. Pay with any UPI app, then tap the button below.</p>
        <img src={qrUrl} alt="UPI QR" style={{ width: 240, height: 240, border: `2px solid ${C.ink}`, background: "#fff", padding: 8 }} />
        <p style={{ fontFamily: FM, fontSize: 13, marginTop: 8 }}>UPI ID: <b>{UPI_ID}</b></p>
        <div style={{ marginTop: 14, padding: 12, border: `1.5px dashed ${C.ink}`, background: C.paper2, fontSize: 13, textAlign: "left" }}>
          After paying, tap the WhatsApp button below and send me your payment screenshot so I can confirm your order. {d.method === "pickup" ? "Then we'll arrange a Pune pickup spot." : "Then it'll be couriered to you."}
        </div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I just paid ₹${total} for my cart order "${titlesList.slice(0, 40)}..." (order ${orderId || ""}). Sending my payment screenshot.`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginTop: 14, width: "100%", padding: 15, boxSizing: "border-box", fontFamily: FM, fontSize: 13, letterSpacing: 1, textTransform: "uppercase", background: "#25D366", color: "#fff", border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>
          Send payment proof on WhatsApp
        </a>
        <button onClick={() => done({ ...d, items: cart, total, zoneName: d.method === "courier" ? ZONES[d.zone].name : null, pending: true })}
          style={{ marginTop: 12, width: "100%", padding: 14, fontFamily: FM, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", background: "transparent", color: C.ink, border: `2px solid ${C.ink}`, cursor: "pointer" }}>
          Done →
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 560, margin: "0 auto" }}>
      {PAYMENT_MODE === "razorpay" && <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>}
      <button onClick={back} style={{ fontFamily: FM, fontSize: 12, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>← back</button>
      <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 34 }}>Checkout</h1>
      <I label="Full name" v={d.name} on={set("name")} />
      <I label="Phone (10-digit)" v={d.phone} on={set("phone")} />
      <I label="Email" v={d.email} on={set("email")} />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {[["pickup", "Self-pickup · FREE"], ["courier", "Local courier"]].map(([v, l]) => (
          <button key={v} onClick={() => setD((p) => ({ ...p, method: v }))} style={{ flex: 1, padding: 12, fontFamily: FM, fontSize: 12, cursor: "pointer", border: `2px solid ${C.ink}`, background: d.method === v ? C.sage : "transparent", color: d.method === v ? C.paper : C.ink }}>{l}</button>
        ))}
      </div>
      {d.method === "courier" && <>
        <label style={{ display: "block", marginTop: 14, fontFamily: FM, fontSize: 11 }}>YOUR PUNE ZONE
          <select value={d.zone} onChange={(e) => setD((p) => ({ ...p, zone: +e.target.value }))} style={inp}>{ZONES.map((z, i) => <option key={i} value={i}>{z.name} — ₹{z.fee}</option>)}</select>
        </label>
        <I label="Full delivery address" v={d.address} on={set("address")} />
      </>}
      <div style={{ marginTop: 20, border: `2px solid ${C.ink}`, background: C.paper2, padding: 14, fontFamily: FM }}>
        {cart.map((item) => (
          <Row key={item.id} k={item.title} v={`₹${item.price}`} />
        ))}
        <Row k="Shipping" v={shipping ? `₹${shipping}` : "FREE"} />
        <div style={{ borderTop: `1.5px solid ${C.ink}`, marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 18 }}><span>Total</span><span style={{ color: C.coral }}>₹{total}</span></div>
      </div>
      <button disabled={!valid || busy} onClick={PAYMENT_MODE === "razorpay" ? payRazorpay : placeUpiOrder}
        style={{ marginTop: 18, width: "100%", padding: 16, fontFamily: FM, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", background: valid && !busy ? C.coral : "#999", color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.ink}`, cursor: valid && !busy ? "pointer" : "not-allowed" }}>
        {busy ? "Please wait…" : PAYMENT_MODE === "razorpay" ? `Pay ₹${total} with Razorpay` : `Reserve & pay by UPI →`}
      </button>
    </div>
  );
}

function Done({ order, home }) {
  const titles = order.items ? order.items.map((i) => i.title).join(", ") : (order.item?.title || "items");
  return (
    <div style={{ padding: "60px 20px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 54 }}>✦</div>
      <h1 style={{ fontFamily: FD, fontWeight: 900, fontSize: 38 }}>{order.pending ? "Almost there!" : "Order placed!"}</h1>
      <p style={{ fontSize: 16 }}>
        Thanks {order.name.split(" ")[0]} — <b>{titles}</b> {order.items && order.items.length > 1 ? "are" : "is"} reserved for you.
        {order.pending ? " Once I confirm your UPI payment, I'll message you to finish up." : ""}
        {order.method === "pickup" ? " We'll sort out a Pune pickup spot." : ` It'll be couriered to your ${(order.zoneName || "").split(" (")[0]} address.`}
      </p>
      <button onClick={home} style={{ marginTop: 22, padding: "14px 28px", fontFamily: FM, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", background: C.ink, color: C.paper, border: `2px solid ${C.ink}`, boxShadow: `5px 5px 0 ${C.coral}`, cursor: "pointer" }}>Keep shopping →</button>
    </div>
  );
}

const inp = { width: "100%", padding: 11, border: `2px solid ${C.ink}`, background: C.paper, fontSize: 15, marginTop: 6 };
function I({ label, v, on }) { return <label style={{ display: "block", marginTop: 14, fontFamily: FM, fontSize: 11 }}>{label.toUpperCase()}<input value={v} onChange={on} style={inp} /></label>; }
function Row({ k, v }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ opacity: .7 }}>{k}</span><span>{v}</span></div>; }
