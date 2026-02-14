import { Github, Linkedin } from "lucide-react";

export function BlogAuthorCard() {
  return (
    <div className="mt-12 p-6 rounded-2xl bg-bg-elevated border border-overlay/10">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan font-bold text-xl flex-shrink-0">
          UK
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-text-primary">
            Ugur Koc
          </h4>
          <p className="text-sm text-accent-cyan font-medium mb-2">
            Microsoft MVP | Intune & Endpoint Management Expert
          </p>
          <p className="text-sm text-text-secondary leading-relaxed mb-3">
            Ugur is the creator of IntuneGet and IntuneBrew. With years of
            experience in enterprise endpoint management, he builds open-source
            tools that help IT teams automate their Microsoft Intune workflows.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ugurkocde"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ugurkocde/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
