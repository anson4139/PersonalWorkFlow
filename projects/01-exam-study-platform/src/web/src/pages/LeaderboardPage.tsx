import { useEffect, useState } from "react";

interface LeaderboardEntry {
  email: string;
  display_name: string | null;
  subject_key: string;
  score: number;
  monsters_defeated: number;
  submitted_at: string;
}

interface LeaderboardPageProps {
  onBack?: () => void;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

const SUBJECT_LABEL: Record<string, string> = {
  "ai-planning": "AI 規劃師",
  "gen-ai-basic": "GenAI 基礎",
  "big-data": "大數據",
  "machine-learning": "機器學習",
  "ai-planning-basic": "AI 基礎",
  fintech: "金融科技",
  "ecommerce-finance-midterm-113": "電商財務",
  "securities-broker": "證券業務",
};

function subjectLabel(key: string): string {
  return SUBJECT_LABEL[key] ?? key;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  useEffect(() => {
    const url =
      subjectFilter === "all"
        ? "/api/leaderboard?limit=20"
        : `/api/leaderboard?subject=${encodeURIComponent(subjectFilter)}&limit=20`;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ entries: LeaderboardEntry[] }>;
      })
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "載入失敗");
        setLoading(false);
      });
  }, [subjectFilter]);

  const subjects = [
    "all",
    ...Array.from(new Set(entries.map((e) => e.subject_key))),
  ];

  return (
    <div className="min-h-dvh bg-black text-gray-200 flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-yellow-500 uppercase tracking-widest font-bold mb-0.5">
              排行榜
            </div>
            <div className="text-lg font-black text-white">最高分紀錄</div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ← 返回
            </button>
          )}
        </div>

        {/* Subject filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {subjects.map((s) => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={`flex-none px-3 py-1 rounded-full text-xs border transition-colors ${
                subjectFilter === s
                  ? "border-yellow-500 text-yellow-400 bg-yellow-900/20"
                  : "border-gray-700 text-gray-500 hover:border-gray-500"
              }`}
            >
              {s === "all" ? "全部" : subjectLabel(s)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center text-gray-600 text-sm py-12">載入中…</div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm py-12">{error}</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-700 text-sm py-12">
            尚無紀錄，快去戰鬥！
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => (
              <div
                key={`${entry.email}-${entry.subject_key}-${entry.submitted_at}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  idx === 0
                    ? "border-yellow-700 bg-yellow-900/10"
                    : idx === 1
                      ? "border-gray-600 bg-gray-900/20"
                      : idx === 2
                        ? "border-orange-800 bg-orange-900/10"
                        : "border-gray-800 bg-gray-900/10"
                }`}
              >
                {/* Rank */}
                <div className="w-6 text-center text-sm">
                  {idx < 3 ? (
                    MEDAL[idx]
                  ) : (
                    <span className="font-mono text-gray-600">{idx + 1}</span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 font-medium truncate">
                    {entry.display_name ?? maskEmail(entry.email)}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {subjectLabel(entry.subject_key)} · 擊敗{" "}
                    {entry.monsters_defeated} 怪
                  </div>
                </div>
                {/* Score */}
                <div className="text-right flex-none">
                  <div className="text-base font-black text-yellow-400">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-700">pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mt-6 w-full py-3 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors"
          >
            ← 返回主選單
          </button>
        )}
      </div>
    </div>
  );
}
