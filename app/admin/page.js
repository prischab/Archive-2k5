"use client";
import { useState, useEffect, useMemo } from "react";
import { UserButton } from "@clerk/nextjs";
import { CATEGORIES } from "@/lib/zones";

const FD = "'Fraunces',Georgia,serif", FB = "'Spline Sans',system-ui,sans-serif", FM = "'Spline Sans Mono',monospace";
const C = { paper: "#F4EDE2", paper2: "#EFE6D8", ink: "#1A1714", coral: "#E8503A", sage: "#7C8C6B", line: "#1A171420" };

// Your private dashboard. Clerk middleware already blocks anyone not logged in.
// Two tabs: add a listing, and see/track every order.
export default function Admin() {
  const [tab, setTab] = useState("add");
  const isDummy = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes("xxxx") || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: FB }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=Spline+Sans:wght@400;500;600&family=Spline+Sans+Mono&display=swap');*{box-sizing:border-box}`}</style>
      
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 20px 60px 20px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `2px solid ${C.ink}`, padding: "14px 0", marginBottom: 24 }}>
          <div style={{ cursor: "pointer" }}>
            <span style={{ fontFamily: FD, fontWeight: 900, fontSize: 26 }}>Admin · Archive </span>
            <span style={{ fontFamily: FM, fontWeight: 700, fontSize: 24, letterSpacing: 1, color: C.coral }}>2K5</span>
          </div>
          {isDummy ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: FM, fontSize: 11, padding: "4px 8px", background: C.sage, color: C.paper, border: `1.5px solid ${C.ink}`, borderRadius: 4, fontWeight: "500" }}>DEV MODE (NO AUTH)</span>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.ink, color: C.paper, display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 14 }}>A</div>
            </div>
          ) : (
            <UserButton />
          )}
        </header>

        <div style={{ display: "flex", gap: 10, margin: "24px 0" }}>
          <button onClick={() => setTab("add")} style={{ ...btn(tab === "add"), flex: 1, fontFamily: FM, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Add Listing</button>
          <button onClick={() => setTab("orders")} style={{ ...btn(tab === "orders"), flex: 1, fontFamily: FM, fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>Orders</button>
        </div>
        
        {tab === "add" ? <AddItem /> : <Orders />}
      </div>
    </div>
  );
}

function AddItem() {
  const [f, setF] = useState({ category: "Tops", wornTimes: "Once", condition: "Like new" });
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setMsg("Saving…");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    setMsg(res.ok ? "✓ Published!" : "Error — check fields");
    if (res.ok) setF({ category: "Tops", wornTimes: "Once", condition: "Like new" });
  }

  return (
    <div style={{ display: "grid", gap: 14, background: C.paper2, border: `2px solid ${C.ink}`, padding: 24, boxShadow: `6px 7px 0 ${C.ink}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <In label="Title *" v={f.title} on={set("title")} />
        <In label="Price ₹ *" v={f.price} on={set("price")} type="number" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <In label="Brand" v={f.brand} on={set("brand")} />
        <label style={labelStyle}>Category
          <select value={f.category} onChange={set("category")} style={inp}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <In label="Size" v={f.size} on={set("size")} />
        <In label="Color" v={f.color} on={set("color")} />
        <In label="Condition" v={f.condition} on={set("condition")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <In label="Waist" v={f.waist} on={set("waist")} />
        <In label="Length" v={f.length} on={set("length")} />
        <In label="Worn Times" v={f.wornTimes} on={set("wornTimes")} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <In label="Chest" v={f.chest} on={set("chest")} />
        <In label="Bust" v={f.bust} on={set("bust")} />
      </div>
      <In label="Image URL (from Cloudinary)" v={f.imageUrl} on={set("imageUrl")} />
      <label style={labelStyle}>Notes
        <textarea value={f.notes || ""} onChange={set("notes")} style={inp} rows={3} />
      </label>
      <button onClick={save} style={{ ...btn(true), marginTop: 10, width: "100%", padding: 16, fontSize: 13, background: C.coral, color: C.paper, boxShadow: `4px 4px 0 ${C.ink}` }}>Publish listing</button>
      {msg && <span style={{ fontFamily: FM, fontSize: 13, fontWeight: "600", color: msg.includes("✓") ? C.sage : C.coral, marginTop: 8, display: "block", textAlign: "center" }}>{msg}</span>}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("pending");
  useEffect(() => { load(); }, []);
  function load() { fetch("/api/orders").then((r) => r.json()).then(setOrders); }

  async function act(id, body) {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    load();
  }
  const nextFulfil = { paid: "booked", booked: "delivered" };

  // Group items belonging to the same cart order (sharing the same upiRef starting with "cart_" or same razorpayId)
  const groupedOrders = useMemo(() => {
    const groups = {};
    const singles = [];

    for (const o of orders) {
      const isUpiGroup = o.upiRef && o.upiRef.startsWith("cart_");
      const isRzpGroup = !!o.razorpayId;
      
      if (isUpiGroup || isRzpGroup) {
        const key = isUpiGroup ? o.upiRef : o.razorpayId;
        if (!groups[key]) {
          groups[key] = {
            id: key,
            buyerName: o.buyerName,
            buyerPhone: o.buyerPhone,
            buyerEmail: o.buyerEmail,
            deliveryMethod: o.deliveryMethod,
            zoneName: o.zoneName,
            address: o.address,
            createdAt: o.createdAt,
            paymentMode: o.paymentMode,
            paymentStatus: o.paymentStatus,
            status: o.status,
            razorpayId: o.razorpayId,
            upiRef: o.upiRef,
            items: [],
            total: 0,
            representativeOrderId: o.id,
          };
        }
        groups[key].items.push(o.product);
        groups[key].total += o.total;
      } else {
        singles.push({
          id: o.id,
          buyerName: o.buyerName,
          buyerPhone: o.buyerPhone,
          buyerEmail: o.buyerEmail,
          deliveryMethod: o.deliveryMethod,
          zoneName: o.zoneName,
          address: o.address,
          createdAt: o.createdAt,
          paymentMode: o.paymentMode,
          paymentStatus: o.paymentStatus,
          status: o.status,
          items: [o.product],
          total: o.total,
          representativeOrderId: o.id,
        });
      }
    }

    const all = [...Object.values(groups), ...singles];
    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return all;
  }, [orders]);

  const shown = groupedOrders.filter((o) =>
    filter === "pending" ? o.paymentStatus === "pending"
    : filter === "paid" ? o.paymentStatus === "paid"
    : true
  );

  const pendingCount = groupedOrders.filter((o) => o.paymentStatus === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {[["pending", `Awaiting payment${pendingCount ? ` (${pendingCount})` : ""}`], ["paid", "Paid"], ["all", "All"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ ...btn(filter === v), flex: 1 }}>{l}</button>
        ))}
      </div>

      {!shown.length && <p style={{ color: "#777", fontFamily: FM, fontSize: 13, textAlign: "center", marginTop: 40 }}>Nothing here yet.</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {shown.map((o) => (
          <div key={o.id} style={{ border: `2px solid ${C.ink}`, borderLeft: `6px solid ${o.paymentStatus === "paid" ? C.sage : C.coral}`, background: C.paper2, padding: 18, boxShadow: `5px 5px 0 ${C.ink}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {o.items.map((item, idx) => (
                  <span key={item?.id || idx} style={{ fontFamily: FD, fontWeight: 900, fontSize: 19 }}>
                    {item?.title} <span style={{ fontFamily: FM, fontSize: 12, fontWeight: "normal", opacity: 0.6 }}>({item?.size ? `Size ${item.size}` : "Free size"})</span>
                  </span>
                ))}
              </div>
              <span style={{ fontFamily: FM, fontWeight: "600", fontSize: 16, color: C.coral }}>₹{o.total}</span>
            </div>
            
            <div style={{ fontSize: 14, color: C.ink, marginTop: 10, lineHeight: 1.5 }}>
              <strong style={{ fontFamily: FM, fontSize: 12 }}>BUYER:</strong> {o.buyerName} ({o.buyerPhone} · {o.buyerEmail})<br />
              <strong style={{ fontFamily: FM, fontSize: 12 }}>DELIVERY:</strong> {o.deliveryMethod === "courier" ? `Courier → ${o.zoneName} · ${o.address}` : "Self-pickup"}
            </div>
            
            <div style={{ fontSize: 12, color: C.ink, opacity: 0.6, marginTop: 8, fontFamily: FM }}>
              {new Date(o.createdAt).toLocaleString()} · paid via {o.paymentMode === "razorpay" ? "Razorpay" : "UPI"}
            </div>

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "4px 10px", background: o.paymentStatus === "paid" ? "#e6efe0" : "#fde8e4", border: `1.5px solid ${o.paymentStatus === "paid" ? C.sage : C.coral}`, color: o.paymentStatus === "paid" ? "#4a5a3a" : "#b03a2e", fontFamily: FM, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {o.paymentStatus === "paid" ? `✓ paid · ${o.status}` : "⏳ awaiting payment"}
              </span>

              {/* UPI pending: confirm money landed, or release the reservation */}
              {o.paymentStatus === "pending" && o.status !== "cancelled" && (
                <>
                  <button onClick={() => act(o.representativeOrderId, { action: "confirm-payment" })} style={{ ...btn(true), background: C.sage, borderColor: C.ink, padding: "6px 12px", fontSize: 11 }}>
                    Confirm payment received
                  </button>
                  <button onClick={() => { if (confirm("Release these items back for sale? The buyer's orders will be cancelled.")) act(o.representativeOrderId, { action: "release" }); }} style={{ ...btn(false), padding: "6px 12px", fontSize: 11, color: C.coral }}>
                    Release (didn't pay)
                  </button>
                </>
              )}

              {/* Paid: advance fulfilment */}
              {o.paymentStatus === "paid" && nextFulfil[o.status] && (
                <button onClick={() => act(o.representativeOrderId, { action: "status", status: nextFulfil[o.status] })} style={{ ...btn(false), padding: "6px 12px", fontSize: 11 }}>
                  Mark {nextFulfil[o.status]}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inp = {
  width: "100%",
  padding: 10,
  marginTop: 6,
  border: `2px solid ${C.ink}`,
  background: C.paper,
  fontSize: 15,
  fontFamily: FB,
  color: C.ink,
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontFamily: FM,
  fontSize: 11,
  color: C.ink,
  textTransform: "uppercase",
};

function In({ label, v, on, type }) {
  return (
    <label style={labelStyle}>
      {label}
      <input value={v || ""} onChange={on} type={type || "text"} style={inp} />
    </label>
  );
}

function btn(active) {
  return {
    padding: "12px 24px",
    borderRadius: 0,
    cursor: "pointer",
    border: `2px solid ${C.ink}`,
    background: active ? C.ink : "transparent",
    color: active ? C.paper : C.ink,
    fontFamily: FM,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    transition: "background 0.2s, color 0.2s",
    boxShadow: active ? `3px 3px 0 ${C.coral}` : "none",
  };
}
