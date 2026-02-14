export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorRole: string;
  readTime: string;
  tags: string[];
  isPillar?: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "deploy-winget-apps-to-intune",
    title:
      "How to Deploy Winget Apps to Microsoft Intune: Complete 2026 Guide",
    description:
      "Learn how to deploy Winget apps to Microsoft Intune using IntuneGet, manual packaging, or the built-in Winget catalog. Step-by-step guide with comparison table and troubleshooting tips.",
    date: "2026-02-14",
    author: "Ugur Koc",
    authorRole: "Microsoft MVP & Intune Expert",
    readTime: "15 min read",
    tags: ["Winget", "Intune", "Deployment", "Guide"],
    isPillar: true,
  },
  {
    slug: "intune-winget-integration-guide",
    title:
      "Microsoft Intune Winget Integration: Everything IT Admins Need to Know",
    description:
      "A comprehensive guide to understanding how Winget integrates with Microsoft Intune, covering architecture, limitations, and best practices for IT administrators.",
    date: "2026-02-14",
    author: "Ugur Koc",
    authorRole: "Microsoft MVP & Intune Expert",
    readTime: "10 min read",
    tags: ["Winget", "Intune", "Integration", "IT Admin"],
  },
  {
    slug: "winget-vs-manual-intune-deployment",
    title: "Winget vs Manual Intune Deployment: Why Automation Wins",
    description:
      "Compare Winget-based automation against manual Intune app deployment. See real time savings, error reduction, and why IT teams are switching to automated workflows.",
    date: "2026-02-14",
    author: "Ugur Koc",
    authorRole: "Microsoft MVP & Intune Expert",
    readTime: "8 min read",
    tags: ["Winget", "Automation", "Comparison", "Intune"],
  },
  {
    slug: "sccm-to-intune-migration-winget",
    title:
      "SCCM to Intune Migration: How to Use Winget for App Re-packaging",
    description:
      "Migrating from SCCM to Intune? Learn how to use Winget and IntuneGet to re-package your application catalog without starting from scratch.",
    date: "2026-02-14",
    author: "Ugur Koc",
    authorRole: "Microsoft MVP & Intune Expert",
    readTime: "12 min read",
    tags: ["SCCM", "Migration", "Winget", "Intune"],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
