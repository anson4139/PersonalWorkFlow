import { Bot, Briefcase, Code2 } from "lucide-react";

const skills = [
  {
    icon: "📋",
    label: "PM 方法論",
    desc: "Scrum / Agile / 5W1H 需求分析 / User Story",
  },
  {
    icon: "🔍",
    label: "系統分析",
    desc: "保險核心系統 / 流程優化 / ERD / 規格文件",
  },
  {
    icon: "🤖",
    label: "AI 應用",
    desc: "Claude / GitHub Copilot / Prompt Engineering",
  },
  {
    icon: "💻",
    label: "前端開發",
    desc: "React / TypeScript / Tailwind CSS / Cloudflare",
  },
];

const linkStyle = {
  border: "1px solid var(--border)",
  color: "var(--text-dim)",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center text-white text-4xl font-black shrink-0"
          style={{ backgroundColor: "var(--green)" }}
        >
          A
        </div>
        <div>
          <h1
            className="text-3xl font-black"
            style={{
              color: "var(--text)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            Anson Chiang
          </h1>
          <p className="mt-1 font-medium" style={{ color: "var(--text-dim)" }}>
            PM × SA × AI
          </p>
          <p
            className="text-sm mt-3 leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            保險業系統分析師出身，現在同時擁抱 PM、AI 與前端開發。
            熱愛把複雜問題簡化，用技術工具讓工作更有效率。
          </p>
        </div>
      </div>

      {/* Skills grid */}
      <h2 className="text-lg font-black mb-4" style={{ color: "var(--text)" }}>
        專業技能
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {skills.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4 transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
              {s.label}
            </p>
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Links */}
      <h2 className="text-lg font-black mb-4" style={{ color: "var(--text)" }}>
        相關連結
      </h2>
      <div className="flex flex-wrap gap-3">
        <a
          href="https://resume.buclaw.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--green-border)";
            e.currentTarget.style.color = "var(--green-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          <Briefcase size={14} />
          個人履歷
        </a>
        <a
          href="https://github.com/anson4139"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--green-border)";
            e.currentTarget.style.color = "var(--green-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          <Code2 size={14} />
          GitHub
        </a>
        <a
          href="https://exam.buclaw.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl transition-colors"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--green-border)";
            e.currentTarget.style.color = "var(--green-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          <Bot size={14} />
          考試平台
        </a>
      </div>
    </div>
  );
}
