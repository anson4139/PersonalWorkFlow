import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicSettings, type PublicSettings } from "../lib/api";

const cardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
};

export default function AuthorCard() {
  const [settings, setSettings] = useState<PublicSettings>({});

  useEffect(() => {
    getPublicSettings().then(setSettings).catch(console.error);
  }, []);

  const name = settings.author_name || "Anson Chiang";
  const bio =
    settings.author_bio || "分享 PM 方法論、AI 應用、系統分析與職涯心得。";
  const avatar = settings.author_avatar || "/avatar.jpg";

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      <div
        className="flex items-center gap-2 mb-3 text-sm font-bold"
        style={{ color: "var(--text)" }}
      >
        <User size={15} style={{ color: "var(--green)" }} />
        關於作者
      </div>
      <div className="flex flex-col items-center text-center">
        <img
          src={avatar}
          alt={name}
          className="w-16 h-16 rounded-full mb-3 object-cover"
          style={{ border: "2px solid var(--green-border)" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
          {name}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
          PM × SA × AI
        </p>
        {bio && (
          <p
            className="text-xs mt-2 leading-relaxed"
            style={{ color: "var(--text-muted)" }}
          >
            {bio}
          </p>
        )}
      </div>
    </div>
  );
}
