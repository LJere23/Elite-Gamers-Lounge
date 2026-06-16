"use client";

import { useState } from "react";
import { Clock, Users } from "lucide-react";

const SESSION_TYPES = ["Hourly Play", "Pro Tournament Entry", "Team Training Session", "Birthday Package"];
const WHATSAPP = "263784497531";

export default function BookingsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    dateTime: "",
    sessionType: SESSION_TYPES[0],
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = [
      `*Booking Request — Elite Gamers Lounge*`,
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Date/Time: ${form.dateTime}`,
      `Session: ${form.sessionType}`,
      form.notes ? `Notes: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  }

  const inputClass =
    "mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400";

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-10 shadow-2xl shadow-black/40">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left */}
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
              Book your next game session
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Reserve a seat at Gweru&apos;s premium gaming lounge.
            </h1>
            <p className="max-w-2xl text-slate-300">
              Fill in the form and we&apos;ll reach out on WhatsApp to confirm your slot. Fast WiFi, premium PCs, and
              live tournament access await.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 p-6">
                <Clock size={18} className="text-cyan-400 mb-3" />
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Hours</p>
                <p className="mt-1 text-xl font-bold text-white">10:00 AM – 12:00 AM</p>
              </div>
              <div className="rounded-3xl bg-white/5 p-6">
                <Users size={18} className="text-cyan-400 mb-3" />
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Group size</p>
                <p className="mt-1 text-xl font-bold text-white">Solo to Teams</p>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              We confirm bookings via WhatsApp. Questions? Message us at{" "}
              <a
                href={`https://wa.me/${WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                +263 784 497 531
              </a>
            </p>
          </div>

          {/* Right — form */}
          <div className="rounded-[2rem] border border-white/10 bg-black/70 p-8">
            <h2 className="text-2xl font-bold text-white">Request a booking</h2>
            <p className="mt-2 text-slate-400 text-sm">We&apos;ll confirm via WhatsApp.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block text-sm font-medium text-slate-100">
                Your name
                <input name="name" value={form.name} onChange={handleChange} type="text" placeholder="Full name" required className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-100">
                Email
                <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com" required className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-slate-100">
                Preferred date & time
                <input name="dateTime" value={form.dateTime} onChange={handleChange} type="datetime-local" required className={`${inputClass} [color-scheme:dark]`} />
              </label>
              <label className="block text-sm font-medium text-slate-100">
                Session type
                <select name="sessionType" value={form.sessionType} onChange={handleChange} className={inputClass}>
                  {SESSION_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-100">
                Notes <span className="text-slate-500 font-normal">(optional)</span>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Any special requests?" className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400 resize-none" />
              </label>
              <button
                type="submit"
                className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:bg-cyan-400"
              >
                Send booking via WhatsApp
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
