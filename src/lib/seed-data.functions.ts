import { createServerFn } from "@tanstack/react-start";

const FIRST = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Ayaan","Krishna","Ishaan",
  "Ananya","Diya","Priya","Aanya","Aadhya","Saanvi","Pari","Myra","Anika","Navya",
  "Rohan","Kabir","Dhruv","Aryan","Karthik","Neel","Yash","Aarush","Veer","Arnav",
  "Isha","Tara","Nisha","Meera","Sara","Kiara","Riya","Sia","Anvi","Aisha",
];
const LAST = ["Sharma","Verma","Patel","Iyer","Reddy","Mehta","Kapoor","Khan","Singh","Joshi","Nair","Rao","Bose","Banerjee","Chopra","Gupta","Malhotra","Shah","Pillai","Desai"];
const CITIES = ["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Kolkata","Jaipur"];
const CATEGORIES = ["denim","ethnic","western","footwear","accessories","coords"] as const;
const TRY_ON_ITEMS = ["Black coord set","Palazzo pants","Linen shirt","Denim jacket","Lehenga skirt","Crop blazer","Striped tee","Wide-leg jeans","Embroidered kurta","Slip dress"];

const r = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const rint = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const rfloat = (min: number, max: number) => Math.random() * (max - min) + min;

interface SeedCustomer {
  name: string; email: string; phone: string; city: string; gender: string; age: number;
  persona: string; preferred_channel: string;
  loyalty_tier?: string; loyalty_points?: number;
  favorite_category: string; discount_sensitivity: string;
  try_on_items?: string[]; last_review_rating?: number | null;
}

function makeCustomer(persona: string): SeedCustomer {
  const gender = Math.random() < 0.55 ? "F" : "M";
  const first = r(FIRST);
  const last = r(LAST);
  const name = `${first} ${last}`;
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${rint(1,999)}@drape.in`;
  const phone = `+91${rint(70000,99999)}${rint(10000,99999)}`;
  let age = rint(20, 45);
  let channel = "whatsapp", cat = "western", disc = "medium", tier = "Fan", points = rint(50,800);

  if (persona === "Trend Chaser") { age = rint(20,28); cat = r(["denim","western","coords"]); channel = "whatsapp"; disc = "medium"; points = rint(200,1200); }
  if (persona === "Discount Hunter") { channel = "sms"; disc = "high"; cat = r(CATEGORIES); points = rint(100,900); }
  if (persona === "Loyalist") { age = rint(28,45); channel = "email"; disc = "low"; cat = r(["ethnic","accessories","coords"]); points = rint(2500,8000); tier = points >= 5000 ? "Icon" : "Muse"; }
  if (persona === "Lapsed High-Value") { channel = "email"; disc = "low"; cat = r(["ethnic","accessories"]); points = rint(1500,4000); tier = "Muse"; }
  if (persona === "New Shopper") { channel = r(["whatsapp","email","sms"]); cat = r(CATEGORIES); points = rint(0,300); }

  const c: SeedCustomer = {
    name, email, phone, city: r(CITIES), gender, age,
    persona, preferred_channel: channel, favorite_category: cat, discount_sensitivity: disc,
    loyalty_tier: tier, loyalty_points: points,
  };
  if (persona === "Trend Chaser" && Math.random() < 0.15) {
    c.try_on_items = Array.from({ length: rint(1,2) }, () => r(TRY_ON_ITEMS));
  }
  if (Math.random() < 0.2) c.last_review_rating = rint(1,5);
  return c;
}

function makeOrders(customer: { id: string; persona: string; favorite_category: string; created_at?: string }) {
  const persona = customer.persona;
  let count = rint(1, 8);
  if (persona === "Loyalist") count = rint(6, 12);
  if (persona === "Lapsed High-Value") count = rint(4, 9);
  if (persona === "New Shopper") count = rint(1, 2);
  const today = new Date();
  const orders: { customer_id: string; order_date: string; amount: number; category: string; items: string; channel: string; on_sale: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    let daysAgo: number;
    if (persona === "Lapsed High-Value") daysAgo = rint(90, 300);
    else if (persona === "New Shopper") daysAgo = rint(1, 30);
    else daysAgo = rint(5, 240);
    const d = new Date(today); d.setDate(d.getDate() - daysAgo);
    let amt = rfloat(800, 8000);
    if (persona === "Lapsed High-Value") amt = rfloat(2500, 8000);
    if (persona === "Loyalist") amt = rfloat(1800, 6500);
    const onSale = persona === "Discount Hunter" ? Math.random() < 0.7 : Math.random() < 0.2;
    orders.push({
      customer_id: customer.id,
      order_date: d.toISOString().slice(0,10),
      amount: Math.round(amt),
      category: customer.favorite_category,
      items: `${customer.favorite_category} item`,
      channel: Math.random() < 0.8 ? "online" : "in-store",
      on_sale: onSale,
    });
  }
  return orders;
}

export const seedDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Wipe (keep order: messages → campaigns → segments → loyalty_events → orders → customers → agent_conversations)
  await supabaseAdmin.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("campaigns").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("segments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("loyalty_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabaseAdmin.from("customers").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const dist = [
    ["Trend Chaser", 80], ["Discount Hunter", 70], ["Loyalist", 60],
    ["Lapsed High-Value", 50], ["New Shopper", 40],
  ] as const;
  const customers: SeedCustomer[] = [];
  for (const [p, n] of dist) for (let i = 0; i < n; i++) customers.push(makeCustomer(p));

  // Insert customers in chunks of 100
  const inserted: { id: string; persona: string; favorite_category: string }[] = [];
  for (let i = 0; i < customers.length; i += 100) {
    const chunk = customers.slice(i, i + 100);
    const { data, error } = await supabaseAdmin.from("customers").insert(chunk).select("id, persona, favorite_category");
    if (error) throw error;
    if (data) {
      for (const row of data) {
        inserted.push({
          id: row.id,
          persona: row.persona ?? "New Shopper",
          favorite_category: row.favorite_category ?? "western",
        });
      }
    }
  }

  // Orders
  const allOrders: ReturnType<typeof makeOrders> = [];
  for (const c of inserted) allOrders.push(...makeOrders(c));
  for (let i = 0; i < allOrders.length; i += 500) {
    await supabaseAdmin.from("orders").insert(allOrders.slice(i, i + 500));
  }
  for (const c of inserted) {
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("amount, order_date")
      .eq("customer_id", c.id)
      .order("order_date", { ascending: false });
    if (!orders || orders.length === 0) continue;
    const total = orders.reduce((s: number, o) => s + Number(o.amount), 0);
    const last = orders[0].order_date as string;
    const days = Math.round((Date.now() - new Date(last).getTime()) / 86400000);
    const oc = orders.length;
    const recency = days <= 30 ? 30 : days <= 60 ? 20 : days <= 90 ? 10 : 0;
    const frequency = oc < 1 ? 0 : oc === 1 ? 5 : oc <= 3 ? 10 : oc <= 6 ? 18 : oc <= 10 ? 22 : 25;
    const monetary = total < 2000 ? 5 : total < 8000 ? 12 : total < 20000 ? 20 : 25;
    const { data: cust } = await supabaseAdmin
      .from("customers")
      .select("loyalty_tier, last_review_rating, try_on_items, referral_count")
      .eq("id", c.id)
      .maybeSingle();
    const tier = (cust as { loyalty_tier?: string | null } | null)?.loyalty_tier ?? null;
    const loyalty = tier === "Icon" ? 10 : tier === "Muse" ? 6 : tier === "Fan" ? 2 : 0;
    const lrr = (cust as { last_review_rating?: number | null } | null)?.last_review_rating ?? 0;
    const toi = (cust as { try_on_items?: string[] | null } | null)?.try_on_items ?? null;
    const ref = (cust as { referral_count?: number | null } | null)?.referral_count ?? 0;
    const engagement =
      (lrr >= 4 ? 5 : 0) +
      (toi && toi.length ? 3 : 0) +
      (ref > 0 ? 2 : 0);
    const health = Math.max(0, Math.min(100, recency + frequency + monetary + loyalty + engagement));
    await supabaseAdmin
      .from("customers")
      .update({
        total_spent: total,
        order_count: orders.length,
        last_order_date: last,
        days_since_last_order: days,
        avg_order_value: Math.round(total / orders.length),
        health_score: health,
      })
      .eq("id", c.id);
  }

  // Loyalty events
  const loyaltyEvents: { customer_id: string; event_type: string; points_earned: number; description: string }[] = [];
  for (const c of inserted) {
    if (Math.random() < 0.5) loyaltyEvents.push({ customer_id: c.id, event_type: "purchase", points_earned: rint(50, 300), description: "Reward from purchase" });
    if (Math.random() < 0.15) loyaltyEvents.push({ customer_id: c.id, event_type: "review", points_earned: 100, description: "Wrote a review" });
    if (Math.random() < 0.1) loyaltyEvents.push({ customer_id: c.id, event_type: "referral", points_earned: 500, description: "Referred a friend" });
  }
  if (loyaltyEvents.length) await supabaseAdmin.from("loyalty_events").insert(loyaltyEvents);

  return { ok: true, customers: inserted.length, orders: allOrders.length };
});
