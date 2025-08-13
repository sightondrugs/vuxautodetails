// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

/* ================== CONTACTS (safe) ==================
   - Set VITE_OWNER_PHONE in Vercel (any format is fine).
   - Fallback here keeps builds working if the env var is missing.
*/
const CONTACTS = {
  owner: {
    name: "Vux Auto Details",
    phone: String(import.meta.env.VITE_OWNER_PHONE || "7869072016"),
  },
  employees: [
    { name: "Alex", phone: "3055550001" },
    // { name: "Brenda", phone: "3055550002" },
  ],
};
// tel: link helper (keeps + and digits only)
const telHref = (p = "") => "tel:" + String(p).replace(/[^\d+]/g, "");

export default function App() {
  // -------------- THEME --------------
  const getPreferredTheme = () => {
    const hasWindow = typeof window !== "undefined";
    const saved = hasWindow ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") return saved;
    const prefersDark =
      hasWindow && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  };
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  // Auto-follow OS only if the user hasn't set a manual choice
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!m) return;
    const onChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);

  const T = useMemo(() => {
    const dark = theme === "dark";
    return {
      page: dark ? "bg-neutral-900 text-neutral-100" : "bg-neutral-50 text-neutral-900",
      header: dark ? "bg-neutral-900/80 border-neutral-800" : "bg-white/80 border-neutral-200",
      card: dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200",
      muted: dark ? "text-neutral-400" : "text-neutral-600",
      subMuted: dark ? "text-neutral-300" : "text-neutral-700",
      primaryBtn:
        dark ? "bg-white text-neutral-900 hover:opacity-90" : "bg-black text-white hover:opacity-90",
      selectOn: dark ? "bg-white text-neutral-900" : "bg-black text-white",
      selectOff: dark ? "border-neutral-700 hover:border-neutral-500" : "border hover:border-neutral-400",
      labelPickOn: dark ? "border-white bg-neutral-800" : "border-black bg-neutral-50",
      input: dark
        ? "mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-100 placeholder-neutral-400 px-3 py-2 text-sm"
        : "mt-1 w-full rounded-xl border px-3 py-2 text-sm",
      okBox: dark
        ? "rounded-xl border border-green-400 bg-green-900/20 px-4 py-3 text-sm text-green-300"
        : "rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800",
      errBox: dark
        ? "rounded-xl border border-red-400 bg-red-900/20 px-4 py-3 text-sm text-red-300"
        : "rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800",
      ring: dark ? "ring-2 ring-white" : "ring-2 ring-black",
      footer: dark ? "border-neutral-800 bg-neutral-900" : "border-neutral-200 bg-white",
      menu: dark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200",
    };
  }, [theme]);

  // -------------- FORM --------------
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    packageId: "basic",
    date: "",
    time: "",
    notes: "",
  });
  const [ui, setUi] = useState({ submitting: false, ok: false, msg: "", err: "" });
  const [showContacts, setShowContacts] = useState(false);

  const PACKAGES = {
    basic: {
      id: "basic",
      name: "Basic Detail",
      price: 45,
      features: ["Exterior wash & dry", "Tire shine", "Interior vacuum", "Windows inside & out"],
    },
    ultimate: {
      id: "ultimate",
      name: "Ultimate Detail",
      price: 60,
      features: [
        "Foam cannon hand wash",
        "Clay bar & spray sealant",
        "Interior deep clean & shampoo",
        "Trim & tire dressing + windows",
      ],
    },
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setUi({ submitting: true, ok: false, msg: "", err: "" });

    if (!form.name || !form.phone || !form.email || !form.vehicle || !form.date || !form.time) {
      setUi({ submitting: false, ok: false, msg: "", err: "Please fill out all required fields." });
      return;
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      vehicle: form.vehicle,
      package_id: form.packageId,
      package_name: PACKAGES[form.packageId].name,
      price: PACKAGES[form.packageId].price,
      appt_date: form.date,
      appt_time: form.time,
      notes: form.notes,
      status: "new",
    };

    const { error } = await supabase.from("appointments").insert(payload);
    if (error) {
      console.error(error);
      setUi({
        submitting: false,
        ok: false,
        msg: "",
        err: "Could not submit right now. Please try again.",
      });
      return;
    }

    setUi({
      submitting: false,
      ok: true,
      msg: `Thanks, ${form.name.split(" ")[0]}! We'll confirm your ${PACKAGES[form.packageId].name} on ${form.date} at ${form.time}.`,
      err: "",
    });

    setForm({
      name: "",
      phone: "",
      email: "",
      vehicle: "",
      packageId: "basic",
      date: "",
      time: "",
      notes: "",
    });
  }

  // -------------- UI --------------
  return (
    <div className={`min-h-screen ${T.page}`}>
      {/* Header */}
      <header className={`sticky top-0 ${T.header} backdrop-blur border-b`}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand + tiny logo spot */}
          <a href="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png" // put your logo at public/images/logo.png
              alt="Vux Auto Details"
              className="h-8 w-8 rounded-xl object-contain"
            />
            <span className="font-semibold">Vux Auto Details</span>
          </a>

          {/* Nav + actions */}
          <nav className="hidden sm:flex gap-3 text-sm items-center relative">
            <a href="#packages" className={T.muted}>Packages</a>
            <a href="#book" className={T.muted}>Book</a>
            <a href="#gallery" className={T.muted}>Gallery</a>

            {/* Call CTA (owner) */}
            <a
              href={telHref(CONTACTS.owner.phone)}
              className={`ml-2 rounded-xl px-3 py-1 font-semibold ${T.primaryBtn}`}
              title={`Call ${CONTACTS.owner.name}`}
            >
              📞 Call
            </a>

            {/* Employees popover (if any) */}
            {CONTACTS.employees.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowContacts((v) => !v)}
                  className={`rounded-xl px-3 py-1 ${T.selectOff}`}
                  title="Other contacts"
                >
                  Team ▾
                </button>
                {showContacts && (
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-md p-2 z-20 ${T.menu}`}
                    onMouseLeave={() => setShowContacts(false)}
                  >
                    <div className="px-2 py-1 text-xs uppercase tracking-wide opacity-70">Contacts</div>
                    <a
                      href={telHref(CONTACTS.owner.phone)}
                      className="block px-3 py-2 rounded-lg hover:opacity-80"
                    >
                      {CONTACTS.owner.name} — {CONTACTS.owner.phone}
                    </a>
                    <div className="h-px my-1 opacity-20 border-t" />
                    {CONTACTS.employees.map((e, i) => (
                      <a key={i} href={telHref(e.phone)} className="block px-3 py-2 rounded-lg hover:opacity-80">
                        {e.name} — {e.phone}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                localStorage.setItem("theme", next); // mark as manual choice
              }}
              title="Toggle dark/light"
              className={`rounded-xl border px-3 py-1 ${T.selectOff}`}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-extrabold">
          Cleaning to perfection. <span className={T.muted}>Book in seconds.</span>
        </h1>
        <p className={`mt-3 ${T.muted}`}>
          Mobile detailing that fits your schedule. Pick Basic for a quick refresh or Ultimate for a
          full transformation.
        </p>
        <div className="flex items-center gap-3 mt-5">
          <a href="#book" className={`rounded-2xl px-5 py-3 text-sm font-semibold ${T.primaryBtn}`}>
            Book Now
          </a>
          {/* Secondary CTA: text/call */}
          <a
            href={telHref(CONTACTS.owner.phone)}
            className={`rounded-xl px-4 py-2 text-sm ${T.selectOff}`}
          >
            Call/Text: {CONTACTS.owner.phone || "Add your number"}
          </a>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold">Packages</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {Object.values(PACKAGES).map((p) => {
            const selected = form.packageId === p.id;
            return (
              <div key={p.id} className={`rounded-2xl border p-5 ${T.card} ${selected ? T.ring : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <div className="text-xl font-bold">${p.price}</div>
                </div>
                <ul className={`mt-3 text-sm ${T.subMuted} space-y-1`}>
                  {p.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span>✅</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setForm((f) => ({ ...f, packageId: p.id }))}
                  className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                    selected ? T.selectOn : T.selectOff
                  }`}
                >
                  {selected ? "Selected" : `Choose ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Booking */}
      <section id="book" className="max-w-5xl mx-auto px-4 py-8">
        <div className={`rounded-2xl border p-5 ${T.card}`}>
          <h2 className="text-2xl font-bold">Book your appointment</h2>

          {ui.err && <div className={`mt-4 ${T.errBox}`}>{ui.err}</div>}
          {ui.ok && <div className={`mt-4 ${T.okBox}`}>{ui.msg}</div>}

          <form onSubmit={handleSubmit} className="mt-5 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Package</label>
              <div className="mt-2 flex gap-3">
                {Object.values(PACKAGES).map((p) => {
                  const selected = form.packageId === p.id;
                  return (
                    <label
                      key={p.id}
                      className={`flex-1 rounded-xl border px-4 py-3 cursor-pointer ${selected ? T.labelPickOn : ""}`}
                    >
                      <input
                        type="radio"
                        name="packageId"
                        value={p.id}
                        checked={selected}
                        onChange={handleChange}
                        className="hidden"
                      />
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.name}</div>
                        <div className="font-semibold">${p.price}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g., Alex Rivera"
                className={T.input}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 555-5555"
                className={T.input}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={T.input}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Vehicle</label>
              <input
                name="vehicle"
                value={form.vehicle}
                onChange={handleChange}
                placeholder="Year Make Model"
                className={T.input}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={T.input}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className={T.input}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Anything we should know?"
                className={`${T.input} min-h-[96px]`}
                rows={3}
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <div className="text-sm">
                Total due on-site:{" "}
                <span className="font-semibold">${PACKAGES[form.packageId].price}</span>
              </div>
              <button
                type="submit"
                disabled={ui.submitting}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60 ${T.primaryBtn}`}
              >
                {ui.submitting ? "Sending..." : "Request Appointment"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold">Our Work</h2>
        <p className={`mt-1 ${T.muted}`}>See the difference our detailing makes.</p>
        <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {["/images/detail1.jpg", "/images/detail2.jpg", "/images/detail3.jpg"].map((src, i) => (
            <div key={i} className={`aspect-video rounded-2xl overflow-hidden border ${T.card}`}>
              <img src={src} alt={`Detailing work ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <p className={`text-sm mt-3 ${T.muted}`}>Showcased Photos</p>
      </section>

      {/* Footer */}
      <footer className={`border-t ${T.footer}`}>
        <div className={`max-w-5xl mx-auto px-4 py-8 text-sm ${T.muted}`}>
          © {new Date().getFullYear()} Detailing by Vux Auto Details — All rights reserved.
        </div>
      </footer>
    </div>
  );
}
