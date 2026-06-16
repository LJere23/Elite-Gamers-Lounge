import Link from "next/link";
import { prisma } from "@/lib/db";
import { Calendar, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Community</p>
        <h1 className="text-5xl font-black uppercase mb-4">Community News</h1>
        <p className="text-gray-400 mb-16">
          Latest tournaments, gaming news and community updates.
        </p>

        {posts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-16 text-center text-zinc-500">
            No posts yet — check back soon!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group rounded-3xl border border-white/10 bg-white/5 p-8 hover:border-cyan-400/30 transition-colors block"
              >
                <h2 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors mb-3">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-zinc-400 mb-6 line-clamp-3">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <User size={12} />
                    {post.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
