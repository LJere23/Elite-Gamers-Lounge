import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { ArrowLeft, Calendar, User } from "lucide-react";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

type Block = { type: "heading1" | "heading2" | "list" | "paragraph"; content: string };

function renderMarkdown(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", content: paragraph.join(" ") });
      paragraph = [];
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "heading2", content: trimmed.slice(3) });
    } else if (trimmed.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "heading1", content: trimmed.slice(2) });
    } else if (trimmed.startsWith("- ")) {
      flushParagraph();
      blocks.push({ type: "list", content: trimmed.slice(2) });
    } else {
      paragraph.push(trimmed);
    }
  }
  flushParagraph();
  return blocks;
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="italic">$1</em>');
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug, published: true },
  });

  if (!post) notFound();

  const blocks = renderMarkdown(post.content);

  return (
    <main className="min-h-screen pt-32 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition mb-10 text-sm"
        >
          <ArrowLeft size={16} />
          Back to news
        </Link>

        {/* Banner image */}
        {post.imageUrl && (
          <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-10 border border-white/10">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <p className="uppercase tracking-[0.3em] text-cyan-400 mb-4">Community</p>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-6">{post.title}</h1>

        <div className="flex items-center gap-5 text-sm text-zinc-500 mb-12 pb-8 border-b border-white/10">
          <span className="flex items-center gap-2">
            <User size={14} />
            {post.author}
          </span>
          <span className="flex items-center gap-2">
            <Calendar size={14} />
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="space-y-4">
          {(() => {
            const elements: React.ReactNode[] = [];
            let i = 0;
            while (i < blocks.length) {
              const block = blocks[i];
              if (block.type === "list") {
                const items: string[] = [block.content];
                while (i + 1 < blocks.length && blocks[i + 1].type === "list") {
                  i++;
                  items.push(blocks[i].content);
                }
                elements.push(
                  <ul key={i} className="list-disc list-inside space-y-1.5 text-zinc-300 text-lg leading-relaxed pl-2">
                    {items.map((item, j) => (
                      <li key={j} dangerouslySetInnerHTML={{ __html: inlineMarkdown(item) }} />
                    ))}
                  </ul>
                );
              } else if (block.type === "heading1") {
                elements.push(
                  <h2 key={i} className="text-3xl font-black text-white mt-8 mb-2">{block.content}</h2>
                );
              } else if (block.type === "heading2") {
                elements.push(
                  <h3 key={i} className="text-2xl font-black text-white mt-6 mb-2">{block.content}</h3>
                );
              } else {
                elements.push(
                  <p
                    key={i}
                    className="text-zinc-300 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: inlineMarkdown(block.content) }}
                  />
                );
              }
              i++;
            }
            return elements;
          })()}
        </div>
      </div>
    </main>
  );
}
