import { useEffect, useRef } from "react";

// ─── Giscus 設定 ────────────────────────────────────────────────────────────
// repo:        anson4139/PersonalWorkFlow  (node_id = R_kgDOSNieFw)
// category:    Blog Comments  (DIC_kwDOSNieF84C8wgb)
// ────────────────────────────────────────────────────────────────────────────
const GISCUS_REPO = "anson4139/PersonalWorkFlow";
const GISCUS_REPO_ID = "R_kgDOSNieFw";
const GISCUS_CATEGORY = "Blog Comments";
const GISCUS_CATEGORY_ID = "DIC_kwDOSNieF84C8wgb";

export default function GiscusComments() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container || container.hasChildNodes()) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", GISCUS_REPO);
    script.setAttribute("data-repo-id", GISCUS_REPO_ID);
    script.setAttribute("data-category", GISCUS_CATEGORY);
    script.setAttribute("data-category-id", GISCUS_CATEGORY_ID);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "dark");
    script.setAttribute("data-lang", "zh-TW");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;
    container.appendChild(script);
  }, []);

  return <div ref={ref} />;
}
