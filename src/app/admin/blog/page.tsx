"use client";

import { useEffect, useRef, useState } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Plus, Trash2, Eye, EyeOff, Edit2, X, Check, Bold, Italic, Heading2, List, Image as ImageIcon, Upload } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  imageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { title: "", content: "", excerpt: "", author: "Admin", published: false, imageUrl: "" };

function insertAround(textarea: HTMLTextAreaElement, before: string, after: string, placeholder: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const newValue = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  return { newValue, cursorStart: start + before.length, cursorEnd: start + before.length + selected.length };
}

function insertAtLineStart(textarea: HTMLTextAreaElement, prefix: string) {
  const start = textarea.selectionStart;
  const lineStart = textarea.value.lastIndexOf("\n", start - 1) + 1;
  const newValue = textarea.value.slice(0, lineStart) + prefix + textarea.value.slice(lineStart);
  return { newValue, cursor: start + prefix.length };
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch("/api/blog?all=1");
    setPosts(await res.json());
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(null);
  }

  function openEdit(post: BlogPost) {
    setForm({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      author: post.author,
      published: post.published,
      imageUrl: post.imageUrl || "",
    });
    setEditing(post.slug);
    setCreating(false);
  }

  function cancel() {
    setCreating(false);
    setEditing(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, imageUrl: form.imageUrl || null };
      if (creating) {
        const res = await fetch("/api/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { cancel(); await load(); }
      } else if (editing) {
        const res = await fetch(`/api/blog/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { cancel(); await load(); }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    setPosts((prev) => prev.filter((p) => p.slug !== slug));
  }

  async function togglePublish(post: BlogPost) {
    const res = await fetch(`/api/blog/${post.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    if (res.ok) await load();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/blog/image", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function applyFormat(type: "bold" | "italic" | "h2" | "h3" | "list") {
    const ta = textareaRef.current;
    if (!ta) return;
    let newValue = form.content;
    let cursorPos = ta.selectionEnd;

    if (type === "bold") {
      const r = insertAround(ta, "**", "**", "bold text");
      newValue = r.newValue;
      cursorPos = r.cursorEnd + 2;
    } else if (type === "italic") {
      const r = insertAround(ta, "_", "_", "italic text");
      newValue = r.newValue;
      cursorPos = r.cursorEnd + 1;
    } else if (type === "h2") {
      const r = insertAtLineStart(ta, "# ");
      newValue = r.newValue;
      cursorPos = r.cursor;
    } else if (type === "h3") {
      const r = insertAtLineStart(ta, "## ");
      newValue = r.newValue;
      cursorPos = r.cursor;
    } else if (type === "list") {
      const r = insertAtLineStart(ta, "- ");
      newValue = r.newValue;
      cursorPos = r.cursor;
    }

    setForm((f) => ({ ...f, content: newValue }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }

  const showForm = creating || editing !== null;
  const inputClass = "mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400";

  return (
    <section className="space-y-8">
      <AdminPageHeader
        title="Blog"
        description="Create and manage posts shown in the Community News section. Supports markdown formatting."
      />

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-3xl border border-cyan-400/30 bg-zinc-950 p-8 space-y-6">
          <h2 className="text-xl font-black text-white">{creating ? "New post" : "Edit post"}</h2>

          <label className="block text-sm font-semibold text-slate-100">
            Title
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} placeholder="Post title" />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Excerpt (optional)
            <input type="text" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className={inputClass} placeholder="Short summary shown in listings" />
          </label>

          <label className="block text-sm font-semibold text-slate-100">
            Author
            <input type="text" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} className={inputClass} />
          </label>

          {/* Banner image */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-100">Banner image <span className="text-slate-500 font-normal">(optional)</span></p>
            {form.imageUrl && (
              <div className="relative w-full max-h-48 overflow-hidden rounded-2xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="Banner" className="w-full object-cover max-h-48" />
                <button
                  onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:text-red-400 transition"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-400 disabled:opacity-50"
              >
                {uploading ? <Upload size={16} className="animate-pulse" /> : <ImageIcon size={16} />}
                {uploading ? "Uploading…" : "Upload image"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {!form.imageUrl && (
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="or paste image URL"
                  className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-cyan-400"
                />
              )}
            </div>
          </div>

          {/* Content with toolbar */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-100">Content</p>
            <div className="flex items-center gap-1 rounded-t-2xl border border-b-0 border-white/10 bg-zinc-900 px-3 py-2">
              <button type="button" onClick={() => applyFormat("bold")} title="Bold (**text**)" className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
                <Bold size={14} />
              </button>
              <button type="button" onClick={() => applyFormat("italic")} title="Italic (_text_)" className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
                <Italic size={14} />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button type="button" onClick={() => applyFormat("h2")} title="Heading (# )" className="h-8 px-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition text-xs font-bold">
                H1
              </button>
              <button type="button" onClick={() => applyFormat("h3")} title="Subheading (## )" className="h-8 px-2 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition text-xs font-bold">
                <Heading2 size={14} />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button type="button" onClick={() => applyFormat("list")} title="Bullet list (- )" className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition">
                <List size={14} />
              </button>
              <div className="ml-auto text-xs text-slate-600">Markdown supported</div>
            </div>
            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={12}
              className="w-full rounded-b-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cyan-400 resize-y font-mono text-sm"
              placeholder="Write your post content here... Use **bold**, _italic_, # Heading, ## Subheading, - List item"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
              className="h-4 w-4 accent-cyan-400"
            />
            <span className="text-sm font-semibold text-slate-100">Publish immediately</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.title || !form.content}
              className="rounded-2xl bg-cyan-500 px-6 py-2.5 font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2"
            >
              <Check size={16} />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={cancel}
              className="rounded-2xl border border-white/10 px-6 py-2.5 font-semibold text-zinc-400 transition hover:border-white/30 flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New post button */}
      {!showForm && (
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 px-5 py-3 text-cyan-400 font-semibold transition hover:bg-cyan-500/20"
        >
          <Plus size={18} />
          New post
        </button>
      )}

      {/* Posts list */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-12 text-center text-zinc-500">
            No posts yet.
          </div>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className={`rounded-3xl border bg-zinc-950 p-6 flex items-start justify-between gap-4 ${
              editing === post.slug ? "border-cyan-400/50" : "border-white/10"
            }`}
          >
            <div className="flex items-start gap-4 min-w-0">
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{post.title}</h3>
                  <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${post.published ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-400"}`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                {post.excerpt && <p className="text-sm text-zinc-400 truncate">{post.excerpt}</p>}
                <p className="text-xs text-zinc-600 mt-1">By {post.author} · {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => togglePublish(post)} title={post.published ? "Unpublish" : "Publish"} className="h-9 w-9 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/30 transition">
                {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={() => openEdit(post)} className="h-9 w-9 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-400/30 transition">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(post.slug)} className="h-9 w-9 rounded-2xl border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-400/30 transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
