import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Minus,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Insight } from "../lib/api";
import { getInsights } from "../lib/api";

// ─── Company roster (always shown even with no data) ─────────────────────────

const COMPANY_GROUPS: [string, string[]][] = [
  ["半導體", ["TSMC", "鴻海", "Broadcom"]],
  ["AI 研究", ["NVIDIA", "AMD", "Intel"]],
  [
    "科技巨頭",
    ["Apple", "Microsoft", "Google", "Amazon", "Meta", "Tesla", "SpaceX"],
  ],
];

// ─── Impact palette ───────────────────────────────────────────────────────────

const IMPACT = {
  high: { label: "高影響", Icon: Flame, color: "#f87171" },
  medium: { label: "中影響", Icon: TrendingUp, color: "#4ade80" },
  low: { label: "低影響", Icon: Minus, color: "#6b7280" },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoWeekNum(d: Date) {
  const tmp = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yr = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yr.getTime()) / 86400000 + 1) / 7);
}

function fmtWeek(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00Z");
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (dt: Date) => `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  return {
    label: `${d.getUTCFullYear()} W${isoWeekNum(d)}`,
    range: `${fmt(d)} – ${fmt(end)}`,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ImpactPill({ impact }: { impact: Insight["impact"] }) {
  const { label, Icon, color } = IMPACT[impact];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

/** Hero card — always-visible top signal of the week */
function HeroCard({ insight }: { insight: Insight }) {
  const { color } = IMPACT[insight.impact];
  return (
    <div
      className="rounded-2xl p-6 mb-5"
      style={{
        background: "var(--surface-2)",
        borderLeft: `4px solid ${color}`,
        border: `1px solid ${color}2a`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Zap size={13} style={{ color }} />
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color }}
        >
          本週最強信號
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span
            className="text-4xl font-black"
            style={{
              color: "var(--green)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {insight.entity}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {insight.entity_group} · {insight.hit_count} 篇報導
          </span>
        </div>
        <ImpactPill impact={insight.impact} />
      </div>
      <p
        className="text-base leading-relaxed mb-4"
        style={{ color: "var(--text)" }}
      >
        {insight.direction}
      </p>
      {insight.key_events?.length > 0 && (
        <ul className="space-y-2">
          {insight.key_events.slice(0, 3).map((ev, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm"
              style={{ color: "var(--text-dim)" }}
            >
              <span
                className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              {ev}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact clickable card for 2nd–4th ranked signals */
function SignalCard({
  insight,
  active,
  onClick,
}: {
  insight: Insight;
  active: boolean;
  onClick: () => void;
}) {
  const { color } = IMPACT[insight.impact];
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl p-4 w-full transition-all"
      style={{
        background: active ? `${color}10` : "var(--surface-2)",
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${active ? `${color}55` : "var(--border)"}`,
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="font-black text-base"
          style={{
            color: "var(--green)",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          {insight.entity}
        </span>
        <span className="text-xs font-medium" style={{ color }}>
          {insight.hit_count} 篇
        </span>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={
          {
            color: "var(--text-dim)",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
          } as React.CSSProperties
        }
      >
        {insight.direction}
      </p>
    </button>
  );
}

/** Inline detail panel — shown when a supporting card or company dot is clicked */
function DetailPanel({
  insight,
  onClose,
}: {
  insight: Insight;
  onClose: () => void;
}) {
  const { color } = IMPACT[insight.impact];
  return (
    <div
      className="rounded-xl p-5 mb-5"
      style={{
        background: "var(--surface-2)",
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${color}44`,
      }}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-baseline gap-3">
          <span
            className="text-xl font-black"
            style={{
              color: "var(--green)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            {insight.entity}
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {insight.entity_group} · {insight.hit_count} 篇
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ImpactPill impact={insight.impact} />
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg"
            style={{
              color: "var(--text-dim)",
              border: "1px solid var(--border)",
              background: "transparent",
            }}
          >
            ✕
          </button>
        </div>
      </div>
      <p
        className="text-sm leading-relaxed mb-3"
        style={{ color: "var(--text)" }}
      >
        {insight.direction}
      </p>
      {insight.key_events?.length > 0 && (
        <ul className="space-y-1.5">
          {insight.key_events.map((ev, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs"
              style={{ color: "var(--text-dim)" }}
            >
              <span
                className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
              />
              {ev}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Company dot chip — colored by impact, dimmed if no data this week */
function CompanyDot({
  name,
  insight,
  active,
  onClick,
}: {
  name: string;
  insight?: Insight;
  active: boolean;
  onClick: () => void;
}) {
  const color = insight ? IMPACT[insight.impact].color : "var(--text-dim)";
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all"
      style={{
        background: active ? `${color}15` : "transparent",
        border: `1px solid ${active ? color : "var(--border)"}`,
        color: insight ? "var(--text)" : "var(--text-dim)",
        opacity: insight ? 1 : 0.38,
        cursor: insight ? "pointer" : "default",
        pointerEvents: insight ? "auto" : "none",
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      {name}
      {insight && (
        <span
          style={{
            color: "var(--text-muted)",
            fontSize: "0.65rem",
            marginLeft: "1px",
          }}
        >
          {insight.hit_count}
        </span>
      )}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [weekIdx, setWeekIdx] = useState(0); // 0 = latest week
  const [focusedEntity, setFocusedEntity] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getInsights(16)
      .then((d) => setAllInsights(d.insights))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  /** Sorted unique week_starts, newest first */
  const weeks = useMemo(() => {
    const s = new Set(allInsights.map((i) => i.week_start));
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [allInsights]);

  const currentWeek = weeks[weekIdx] ?? null;

  /** Insights for this week, sorted high → medium → low, then by hit_count desc */
  const weekInsights = useMemo(() => {
    const ord = { high: 0, medium: 1, low: 2 } as const;
    return allInsights
      .filter((i) => i.week_start === currentWeek)
      .sort((a, b) => {
        if (ord[a.impact] !== ord[b.impact])
          return ord[a.impact] - ord[b.impact];
        return b.hit_count - a.hit_count;
      });
  }, [allInsights, currentWeek]);

  const insightMap = useMemo(() => {
    const m = new Map<string, Insight>();
    weekInsights.forEach((i) => m.set(i.entity, i));
    return m;
  }, [weekInsights]);

  const hero = weekInsights[0] ?? null;
  const supporting = weekInsights.slice(1, 4);
  const weekFmt = currentWeek ? fmtWeek(currentWeek) : null;
  const focusedInsight = focusedEntity
    ? insightMap.get(focusedEntity)
    : undefined;

  const handleWeekChange = (idx: number) => {
    setWeekIdx(idx);
    setFocusedEntity(null);
  };

  const toggleFocus = (entity: string) =>
    setFocusedEntity((prev) => (prev === entity ? null : entity));

  // ── Loading skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        <div
          className="h-8 w-40 rounded-lg animate-pulse"
          style={{ background: "var(--surface-2)" }}
        />
        <div
          className="h-44 rounded-2xl animate-pulse"
          style={{ background: "var(--surface-2)" }}
        />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "var(--surface-2)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error
  if (error) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-10 text-center text-sm"
        style={{ color: "var(--text-dim)" }}
      >
        載入失敗：{error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* ── Header + week navigator */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black"
            style={{
              color: "var(--text)",
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
          >
            産業趨勢
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
            AI 生成 · 每週一自動更新 · 14 家目標企業
          </p>
        </div>

        {weeks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleWeekChange(Math.min(weekIdx + 1, weeks.length - 1))
              }
              disabled={weekIdx >= weeks.length - 1}
              className="p-1.5 rounded-lg"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color:
                  weekIdx >= weeks.length - 1 ? "var(--border)" : "var(--text)",
                cursor: weekIdx >= weeks.length - 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <div className="text-center min-w-[7.5rem]">
              <div
                className="text-sm font-bold"
                style={{ color: "var(--text)" }}
              >
                {weekFmt?.label}
              </div>
              <div className="text-xs" style={{ color: "var(--text-dim)" }}>
                {weekFmt?.range}
              </div>
            </div>
            <button
              onClick={() => handleWeekChange(Math.max(weekIdx - 1, 0))}
              disabled={weekIdx <= 0}
              className="p-1.5 rounded-lg"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: weekIdx <= 0 ? "var(--border)" : "var(--text)",
                cursor: weekIdx <= 0 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* ── Empty week */}
      {weekInsights.length === 0 && (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            本週尚無産業動態
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-dim)", opacity: 0.55 }}
          >
            每週一 08:00 自動生成，或執行 backfill 腳本補填歷史資料
          </p>
        </div>
      )}

      {/* ── Hero card */}
      {hero && <HeroCard insight={hero} />}

      {/* ── Supporting signals (2nd–4th) */}
      {supporting.length > 0 && (
        <div
          className="grid gap-3 mb-5"
          style={{
            gridTemplateColumns: `repeat(${Math.min(supporting.length, 3)}, 1fr)`,
          }}
        >
          {supporting.map((ins) => (
            <SignalCard
              key={ins.id}
              insight={ins}
              active={focusedEntity === ins.entity}
              onClick={() => toggleFocus(ins.entity)}
            />
          ))}
        </div>
      )}

      {/* ── Detail panel (supporting card or company dot click) */}
      {focusedInsight && (
        <DetailPanel
          insight={focusedInsight}
          onClose={() => setFocusedEntity(null)}
        />
      )}

      {/* ── Full-landscape company grid */}
      {weekInsights.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-bold"
              style={{ color: "var(--text-dim)", letterSpacing: "0.06em" }}
            >
              企業全覽
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              {weekInsights.length} / 14 家有動態
            </span>
          </div>
          <div className="space-y-2.5">
            {COMPANY_GROUPS.map(([group, companies]) => (
              <div key={group} className="flex items-center gap-3">
                <span
                  className="text-xs font-medium w-14 shrink-0"
                  style={{ color: "var(--text-dim)" }}
                >
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {companies.map((name) => (
                    <CompanyDot
                      key={name}
                      name={name}
                      insight={insightMap.get(name)}
                      active={focusedEntity === name}
                      onClick={() => toggleFocus(name)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
