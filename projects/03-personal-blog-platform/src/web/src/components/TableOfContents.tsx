import { useEffect, useRef, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface Props {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function TableOfContents({ contentRef }: Props) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Parse headings after content renders
  useEffect(() => {
    if (!contentRef.current) return;
    const headings = Array.from(
      contentRef.current.querySelectorAll("h2, h3"),
    ) as HTMLElement[];

    const tocItems: TocItem[] = headings.map((h, i) => {
      if (!h.id) h.id = `heading-${i}`;
      return {
        id: h.id,
        text: h.textContent ?? "",
        level: parseInt(h.tagName[1]) as 2 | 3,
      };
    });
    setItems(tocItems);
  }, [contentRef]);

  // Track active heading with IntersectionObserver
  useEffect(() => {
    if (items.length === 0) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting heading
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px", threshold: 0 },
    );

    const els = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];
    els.forEach((el) => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-24 text-sm">
      <p
        className="font-semibold text-xs uppercase tracking-widest mb-3"
        style={{ color: "var(--text-muted)" }}
      >
        目錄
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              style={{
                display: "block",
                lineHeight: "1.5",
                paddingLeft: item.level === 3 ? "1.25rem" : "0.5rem",
                borderLeft:
                  activeId === item.id
                    ? "2px solid var(--green)"
                    : "2px solid transparent",
                color:
                  activeId === item.id
                    ? "var(--green-light)"
                    : "var(--text-muted)",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
