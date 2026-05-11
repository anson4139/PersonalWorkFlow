import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LoginModal from "./components/LoginModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AboutPage from "./pages/AboutPage";
import ArchivePage from "./pages/ArchivePage";
import CategoriesPage from "./pages/CategoriesPage";
import CategoryPage from "./pages/CategoryPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PostPage from "./pages/PostPage";
import SearchPage from "./pages/SearchPage";
import TagPage from "./pages/TagPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AiGeneratePage from "./pages/admin/AiGeneratePage";
import AdminCategoriesPage from "./pages/admin/CategoriesPage";
import CommentsPage from "./pages/admin/CommentsPage";
import DashboardPage from "./pages/admin/DashboardPage";
import MediaPage from "./pages/admin/MediaPage";
import PermissionsPage from "./pages/admin/PermissionsPage";
import PostEditorPage from "./pages/admin/PostEditorPage";
import PostsPage from "./pages/admin/PostsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TagsPage from "./pages/admin/TagsPage";

const SUPER_ADMIN_EMAIL = "anson4139@gmail.com";

/** 只允許 super_admin 存取的路由包裝 */
function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null; // 等 auth 初始化完成再判斷
  if (!user || user.email?.toLowerCase() !== SUPER_ADMIN_EMAIL) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <LoginModal />
        <Routes>
          {/* 後台 - 獨立 AdminLayout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="posts/new" element={<PostEditorPage />} />
            <Route path="posts/:id/edit" element={<PostEditorPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="tags" element={<TagsPage />} />
            <Route path="ai-generate" element={<AiGeneratePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route
              path="permissions"
              element={
                <SuperAdminRoute>
                  <PermissionsPage />
                </SuperAdminRoute>
              }
            />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="media" element={<MediaPage />} />
          </Route>

          {/* 前台 - 公共 Layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/posts/:slug" element={<PostPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/categories/:slug" element={<CategoryPage />} />
                  <Route path="/tags/:slug" element={<TagPage />} />
                  <Route path="/archive" element={<ArchivePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
