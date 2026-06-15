"use client";

import { useEffect, useState } from "react";

interface GalleryImage {
  id: string;
  filename: string;
  caption: string | null;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data) => {
        setImages(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Atmosphere</p>
          <h2 className="text-4xl md:text-6xl font-black uppercase">Gallery</h2>
        </div>

        {loaded && images.length === 0 ? (
          <p className="text-center text-zinc-500">
            Photos coming soon — check back after our first events!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="aspect-square rounded-3xl overflow-hidden border border-white/10 hover:scale-[1.02] transition-transform duration-200 relative group"
              >
                <img
                  src={img.filename.startsWith("https://") ? img.filename : `/gallery/uploads/${img.filename}`}
                  alt={img.caption || "Gallery image"}
                  className="w-full h-full object-cover"
                />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {img.caption}
                  </div>
                )}
              </div>
            ))}
            {!loaded &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-3xl bg-zinc-900 animate-pulse"
                />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
