"use client";

import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Trash2, Upload, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: string;
  filename: string;
  caption: string | null;
  sortOrder: number;
  uploadedAt: string;
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/gallery");
    setImages(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", caption);

    setUploading(true);
    try {
      const res = await fetch("/api/gallery", { method: "POST", body: fd });
      if (res.ok) {
        setCaption("");
        if (fileRef.current) fileRef.current.value = "";
        await load();
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Gallery"
        description="Upload and manage photos shown on the public gallery section."
      />

      {/* Upload form */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3">
          <Upload size={20} className="text-cyan-400" />
          Upload image
        </h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-4 items-end">
          <label className="flex-1 text-sm font-semibold text-slate-100 block">
            Image file
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              required
              className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20"
            />
          </label>
          <label className="flex-1 text-sm font-semibold text-slate-100 block">
            Caption (optional)
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Tournament night"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 text-white outline-none focus:border-cyan-400"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-2xl bg-cyan-500 px-6 py-2.5 font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-16 text-center text-zinc-500">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>No images yet. Upload one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 aspect-square"
            >
              <img
                src={`/gallery/uploads/${img.filename}`}
                alt={img.caption || "Gallery image"}
                className="w-full h-full object-cover"
              />
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2 text-xs text-white truncate">
                  {img.caption}
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
