"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface BlogTableOfContentsProps {
  items: TocItem[];
}

export function BlogTableOfContents({ items }: BlogTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="sticky top-24 hidden xl:block" aria-label="Table of contents">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        On this page
      </h4>
      <ul className="space-y-1.5 text-sm border-l border-overlay/10">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "block py-1 transition-colors border-l-2 -ml-px",
                item.level === 3 ? "pl-6" : "pl-4",
                activeId === item.id
                  ? "border-accent-cyan text-accent-cyan"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
