import { Calendar, Clock, Tag } from "lucide-react";

interface BlogPostHeaderProps {
  title: string;
  date: string;
  author: string;
  authorRole: string;
  readTime: string;
  tags: string[];
}

export function BlogPostHeader({
  title,
  date,
  author,
  authorRole,
  readTime,
  tags,
}: BlogPostHeaderProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="mb-10 pb-8 border-b border-overlay/10">
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-cyan/10 text-accent-cyan"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight leading-tight mb-6">
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
        <span className="font-medium text-text-secondary">{author}</span>
        <span className="text-text-muted">{authorRole}</span>
        <time dateTime={date} className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </time>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {readTime}
        </span>
      </div>
    </header>
  );
}
