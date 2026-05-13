import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function LoginModal() {
  const { gisReady, loginModalOpen, closeLoginModal } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);

  // Render the official Google button once the div is in the DOM
  useEffect(() => {
    if (!loginModalOpen || !gisReady || !btnRef.current || !window.google)
      return;
    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "pill",
      locale: "zh-TW",
      width: 240,
    });
  }, [loginModalOpen, gisReady]);

  if (!loginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={closeLoginModal}
    >
      <div
        className="relative rounded-2xl p-8 flex flex-col items-center gap-6 min-w-72"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: "var(--text-dim)" }}
          aria-label="關閉"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center gap-1">
          <p className="text-base font-bold" style={{ color: "var(--text)" }}>
            登入帳號
          </p>
          <p
            className="text-xs text-center"
            style={{ color: "var(--text-muted)" }}
          >
            僅管理員可進入後台管理。
          </p>
        </div>

        {/* Google Sign-In button rendered by GIS SDK */}
        <div ref={btnRef} className="flex justify-center" />

        {!gisReady && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Google 驗證尚未就緒，請稍後再試。
          </p>
        )}
      </div>
    </div>
  );
}
