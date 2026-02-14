import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { BlogPost } from "@/lib/data/blog-data";

interface RelatedPostsProps {
  posts: BlogPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-overlay/10">
      <h3 className="text-xl font-bold text-text-primary mb-6">
        Related Articles
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block p-5 rounded-xl bg-bg-surface border border-overlay/[0.06] hover:border-overlay/10 hover:bg-overlay/[0.02] transition-all duration-200"
          >
            <h4 className="text-sm font-semibold text-text-primary group-hover:text-accent-cyan transition-colors leading-snug mb-2">
              {post.title}
            </h4>
            <p className="text-xs text-text-muted line-clamp-2 mb-3">
              {post.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-cyan group-hover:gap-1.5 transition-all">
                Read
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
