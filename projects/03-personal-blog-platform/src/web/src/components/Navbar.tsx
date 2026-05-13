import { LogIn, LogOut, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user, loading, gisReady, openLoginModal, signOut } = useAuth();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSearchOpen(false);
    }
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "var(--bg)", borderColor: "var(--border)" }}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          to="/"
          className="flex items-center gap-2 font-black text-3xl tracking-tight"
          style={{
            color: "var(--text)",
            fontFamily: "'Barlow Condensed', sans-serif",
          }}
        >
          <img
            src="/logo-icon.png"
            alt="logo"
            className="w-9 h-9 object-contain"
          />
          BLACK HARNESS AI<span style={{ color: "var(--green)" }}>.</span>
        </Link>

        <nav
          className="hidden md:flex items-center gap-8 text-[1.05rem] font-semibold tracking-[0.04em]"
          style={{ color: "var(--text-dim)" }}
        >
          <Link
            to="/"
            className="transition-colors"
            style={{ color: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            首頁
          </Link>
          <Link
            to="/categories"
            className="transition-colors"
            style={{ color: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            分類
          </Link>
          <Link
            to="/trends"
            className="transition-colors"
            style={{ color: "inherit" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-dim)")
            }
          >
            產業趨勢
          </Link>
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="transition-colors"
              style={{ color: "inherit" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--green)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-dim)")
              }
            >
              後台管理
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋文章..."
                className="rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--text-dim)" }}
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-dim)" }}
              aria-label="搜尋"
            >
              <Search size={18} />
            </button>
          )}

          {!loading && (
            <>
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  {user.picture && (
                    <img
                      src={user.picture}
                      alt={user.name ?? user.email}
                      className="w-7 h-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span
                    className="text-xs hidden lg:block max-w-28 truncate"
                    style={{ color: "var(--text-dim)" }}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--text-dim)" }}
                    aria-label="登出"
                    title="登出"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={gisReady ? openLoginModal : undefined}
                  disabled={!gisReady}
                  title={gisReady ? undefined : "Google Client ID 尚未設定"}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-dim)",
                    border: "1px solid var(--border)",
                    opacity: gisReady ? 1 : 0.4,
                    cursor: gisReady ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (!gisReady) return;
                    e.currentTarget.style.borderColor = "var(--green)";
                    e.currentTarget.style.color = "var(--green)";
                  }}
                  onMouseLeave={(e) => {
                    if (!gisReady) return;
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-dim)";
                  }}
                >
                  <LogIn size={14} />
                  登入
                </button>
              )}
            </>
          )}

          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-dim)" }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="選單"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-3 text-sm font-medium"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-dim)",
          }}
        >
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            style={{ color: "inherit" }}
          >
            首頁
          </Link>
          <Link
            to="/categories"
            onClick={() => setMenuOpen(false)}
            style={{ color: "inherit" }}
          >
            分類
          </Link>
          <Link
            to="/trends"
            onClick={() => setMenuOpen(false)}
            style={{ color: "var(--green)" }}
          >
            產業趨勢
          </Link>
          {user?.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMenuOpen(false)}
              style={{ color: "var(--green)" }}
            >
              後台管理
            </Link>
          )}
          <div
            className="pt-1 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            {user ? (
              <button
                onClick={() => {
                  void signOut();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--text-dim)" }}
              >
                <LogOut size={14} />
                {user.email} · 登出
              </button>
            ) : (
              <button
                onClick={() => {
                  if (gisReady) {
                    openLoginModal();
                    setMenuOpen(false);
                  }
                }}
                disabled={!gisReady}
                className="flex items-center gap-2 text-sm"
                style={{
                  color: gisReady ? "var(--green)" : "var(--text-dim)",
                  opacity: gisReady ? 1 : 0.4,
                }}
              >
                <LogIn size={14} />
                {gisReady ? "Google 登入" : "登入（未設定）"}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
