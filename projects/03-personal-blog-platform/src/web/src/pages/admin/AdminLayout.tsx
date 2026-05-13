import {
  ChevronRight,
  ExternalLink,
  FileText,
  FolderOpen,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const SUPER_ADMIN_EMAIL = "anson4139@gmail.com";

const navItems = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
    feature: "dashboard",
  },
  { to: "/admin/posts", label: "文章管理", icon: FileText, feature: "posts" },
  {
    to: "/admin/ai-generate",
    label: "AI 生文",
    icon: Sparkles,
    feature: "ai-generate",
  },
  {
    to: "/admin/comments",
    label: "留言管理",
    icon: MessageSquare,
    feature: "comments",
  },
  {
    to: "/admin/media",
    label: "媒體庫",
    icon: Image,
    feature: "media",
  },
  {
    to: "/admin/categories",
    label: "分類",
    icon: FolderOpen,
    feature: "categories",
  },
  { to: "/admin/tags", label: "標籤", icon: Tag, feature: "tags" },
  { to: "/admin/settings", label: "設定", icon: Settings, feature: "settings" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 非 super_admin 嘗試存取 /admin/permissions → 踢回 dashboard
  useEffect(() => {
    if (!loading && user) {
      if (
        location.pathname === "/admin/permissions" &&
        user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL
      ) {
        navigate("/admin", { replace: true });
      }
    }
  }, [loading, user, location.pathname, navigate]);

  // Auth guard: redirect to home if not authenticated (no login button to avoid loop)
  if (!loading && !user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* ── Mobile overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: static | mobile: drawer) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 flex flex-col border-r
          transition-transform duration-200
          md:static md:translate-x-0 md:w-56 md:flex-shrink-0
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
            to="/admin"
            className="flex items-center gap-2"
            onClick={() => setDrawerOpen(false)}
          >
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: "var(--green)", color: "#000" }}
            >
              ADMIN
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              BLACK HARNESS AI.
            </span>
          </Link>
          {/* Close button (mobile only) */}
          <button
            className="md:hidden p-1 rounded hover:opacity-70"
            style={{ color: "var(--text-dim)" }}
            onClick={() => setDrawerOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {(() => {
            const isSuperAdmin =
              user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
            const userFeatures = user?.features ?? [];
            const visible = isSuperAdmin
              ? navItems
              : navItems.filter((item) => userFeatures.includes(item.feature));
            return visible.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? "font-medium" : "hover:opacity-80"
                  }`
                }
                style={({ isActive }) => ({
                  background: isActive ? "var(--green-dim)" : "transparent",
                  color: isActive ? "var(--green)" : "var(--text-dim)",
                  borderLeft: isActive
                    ? "2px solid var(--green)"
                    : "2px solid transparent",
                })}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ));
          })()}
          {/* 權限管理：僅 super_admin 可見 */}
          {user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL && (
            <NavLink
              to="/admin/permissions"
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "font-medium" : "hover:opacity-80"
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--green-dim)" : "transparent",
                color: isActive ? "var(--green)" : "var(--text-dim)",
                borderLeft: isActive
                  ? "2px solid var(--green)"
                  : "2px solid transparent",
              })}
            >
              <ShieldCheck size={15} />
              權限管理
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <ExternalLink size={11} />
            前台首頁
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-12 flex items-center px-4 border-b text-sm gap-2"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-dim)",
          }}
        >
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden p-1 -ml-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-dim)" }}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>

          <button
            onClick={() => navigate(-1)}
            className="hover:opacity-70 transition-opacity hidden sm:block"
          >
            ‹ 返回
          </button>
          <ChevronRight size={13} className="hidden sm:block" />
          <span style={{ color: "var(--text)" }}>後台管理</span>

          {/* 登入狀態 */}
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <div
                  className="hidden sm:flex items-center gap-1.5 text-xs"
                  style={{ color: "var(--text-dim)" }}
                >
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name ?? user.email}
                      className="w-5 h-5 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={12} style={{ color: "var(--green)" }} />
                  )}
                  <span>{user.name ?? user.email}</span>
                </div>
                {/* Mobile: avatar only */}
                <div className="sm:hidden">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name ?? user.email}
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={14} style={{ color: "var(--green)" }} />
                  )}
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1 text-xs hover:opacity-70 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                  title="登出"
                >
                  <LogOut size={12} />
                  <span className="hidden sm:inline">登出</span>
                </button>
              </>
            ) : null}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
