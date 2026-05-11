import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p
        className="text-8xl font-black mb-2"
        style={{
          color: "var(--surface-3)",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}
      >
        404
      </p>
      <h1 className="text-2xl font-black mb-3" style={{ color: "var(--text)" }}>
        找不到這個頁面
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-dim)" }}>
        你要找的頁面不存在，可能已被移除或連結有誤。
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--green)", color: "#000" }}
      >
        回到首頁
      </Link>
    </div>
  );
}
