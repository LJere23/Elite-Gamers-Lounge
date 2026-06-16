import { prisma } from "@/lib/db";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await prisma.loungeSettings.findUnique({
    where: { id: "singleton" },
  });

  const address = settings?.address || "Gweru, Zimbabwe";
  const phone = settings?.contactPhone || "";
  const email = settings?.contactEmail || "";
  const openingTime = settings?.openingTime || "09:00";
  const closingTime = settings?.closingTime || "22:00";
  const whatsappNumber = settings?.whatsappNumber || "263784497531";
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hi! I'd like to know more about Elite Gamers Lounge."
  )}`;

  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Get in touch</p>
        <h1 className="text-5xl font-black uppercase mb-4">Contact Us</h1>
        <p className="text-zinc-400 mb-16">
          We&apos;re here to help — reach us on WhatsApp for the fastest response.
        </p>

        {/* WhatsApp CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-3xl bg-green-500 hover:bg-green-400 transition px-8 py-4 text-white font-black text-lg mb-16 shadow-lg shadow-green-500/20"
        >
          <MessageCircle size={24} />
          Chat on WhatsApp
        </a>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-purple-400/30 transition">
            <MapPin className="text-purple-400 mb-4" size={24} />
            <h3 className="text-xl font-bold mb-2">Location</h3>
            <p className="text-gray-400">{address}</p>
          </div>

          {phone && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-400/30 transition">
              <Phone className="text-cyan-400 mb-4" size={24} />
              <h3 className="text-xl font-bold mb-2">Phone</h3>
              <a href={`tel:${phone}`} className="text-gray-400 hover:text-cyan-400 transition">
                {phone}
              </a>
            </div>
          )}

          {email && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-purple-400/30 transition">
              <Mail className="text-purple-400 mb-4" size={24} />
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <a
                href={`mailto:${email}`}
                className="text-gray-400 hover:text-purple-400 transition break-all"
              >
                {email}
              </a>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-400/30 transition">
            <Clock className="text-cyan-400 mb-4" size={24} />
            <h3 className="text-xl font-bold mb-2">Hours</h3>
            <p className="text-gray-400">
              {openingTime} – {closingTime}
            </p>
            <p className="text-gray-500 text-sm mt-1">Every day</p>
          </div>
        </div>
      </div>
    </main>
  );
}
