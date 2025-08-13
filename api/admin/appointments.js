import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // --- get caller IP ---
  const fwd = req.headers["x-forwarded-for"] || "";
  const ip =
    String(fwd).split(",")[0].trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown";

  // --- IP allowlist ---
  const allowed = (process.env.ADMIN_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length && !allowed.includes(ip)) {
    return res.status(403).json({ error: "Forbidden (IP)", ip });
  }

  // --- ONLY require token if it's non-empty after trimming ---
  const token = (process.env.ADMIN_TOKEN || "").trim();
  if (token.length > 0) {
    const auth = req.headers.authorization || "";
    if (auth !== `Bearer ${token}`) {
      return res.status(401).json({ error: "Unauthorized (token)" });
    }
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  );

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appt_date", { ascending: true })
      .order("appt_time", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ip, data });
  }

  if (req.method === "PATCH") {
    // handle raw string body too
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { id, status } = body;
    if (!id || !status) return res.status(400).json({ error: "id and status required" });

    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
