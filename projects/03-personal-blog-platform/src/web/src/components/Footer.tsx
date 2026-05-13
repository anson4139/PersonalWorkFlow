import { Rss } from "lucide-react";

declare const __APP_VERSION__: string;

export default function Footer() {
  return (
    <footer
      className="mt-16 border-t"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      <div
        className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
        style={{ color: "var(--text-dim)" }}
      >
        <p>
          © {new Date().getFullYear()}{" "}
          <a
            href="https://resume.buclaw.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors"
            style={{ color: "var(--text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
          >
            ANSON CHIANG
          </a>{" "}
          — PM × SA × AI
        </p>
        <div className="flex items-center gap-4">
          <a
            href="/api/feed"
            className="flex items-center gap-1 transition-colors"
            style={{ color: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            <Rss size={14} />
            RSS
          </a>
          <span style={{ color: "var(--green)" }} className="text-xs font-mono">
            v{__APP_VERSION__}
          </span>
        </div>
      </div>
    </footer>
  );
}
