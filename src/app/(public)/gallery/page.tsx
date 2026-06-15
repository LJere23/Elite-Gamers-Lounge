import { prisma } from "@/lib/db";

export const revalidate = 60;

export default async function GalleryPage() {
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
  });

  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Atmosphere</p>
        <h1 className="text-5xl font-black uppercase mb-4">Gallery</h1>
        <p className="text-zinc-400 mb-16">
          A look inside Gweru&apos;s premier gaming experience.
        </p>

        {images.length === 0 ? (
          <p className="text-zinc-500 text-center py-20">
            Photos coming soon — check back after our first events!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="aspect-square rounded-3xl overflow-hidden border border-white/10 hover:scale-[1.02] transition-transform duration-200 relative group"
              >
                <img
                  src={`/gallery/uploads/${img.filename}`}
                  alt={img.caption || "Gallery image"}
                  className="w-full h-full object-cover"
                />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
