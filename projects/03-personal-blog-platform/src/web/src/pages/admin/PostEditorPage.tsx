import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Bold,
  Code,
  Eye,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Save,
  Send,
  Strikethrough,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createPost,
  getAdminCategories,
  getAdminPost,
  getAdminTags,
  trackEvent,
  updatePost,
  uploadImage,
  type AdminCategory,
  type AdminTag,
} from "../../lib/adminApi";

export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [preview, setPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "開始撰寫你的文章..." }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] focus:outline-none px-1 py-2",
      },
    },
  });

  // Load categories / tags
  useEffect(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => {});
    getAdminTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  // Load existing post
  useEffect(() => {
    if (!isNew && id) {
      getAdminPost(Number(id))
        .then((post) => {
          setTitle(post.title);
          setExcerpt(post.excerpt);
          setCoverUrl(post.cover_url ?? "");
          setStatus(post.status);
          editor?.commands.setContent(post.content);
          if (post.category_ids)
            setSelectedCategories(
              post.category_ids.split(",").map(Number).filter(Boolean),
            );
          if (post.tag_ids)
            setSelectedTags(
              post.tag_ids.split(",").map(Number).filter(Boolean),
            );
        })
        .catch((e) => setError(String(e)));
    }
  }, [id, editor]);

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      setError("請填寫文章標題");
      return;
    }
    setSaving(true);
    setError("");
    const content = editor?.getHTML() ?? "";
    const payload = {
      title: title.trim(),
      content,
      excerpt: excerpt.trim(),
      cover_url: coverUrl.trim() || undefined,
      status: publish ? "published" : status,
      category_ids: selectedCategories,
      tag_ids: selectedTags,
    };
    try {
      if (isNew) {
        const res = await createPost(payload);
        trackEvent("post_create", "/admin/posts/new", { post_id: res.id });
        navigate(`/admin/posts/${res.id}/edit`, { replace: true });
      } else {
        await updatePost(Number(id), payload);
        trackEvent(
          publish ? "post_publish" : "post_save",
          `/admin/posts/${id}/edit`,
          { post_id: Number(id) },
        );
        const msg = publish ? "已發佈" : "已儲存";
        setSavedMsg(msg);
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (e) {
        setError(`圖片上傳失敗：${e}`);
      }
    };
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = prompt("輸入連結 URL", prev);
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().unsetLink().run();
      return;
    }
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={() => navigate("/admin/posts")}
          className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
          style={{ color: "var(--text-dim)" }}
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">返回列表</span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-sm border transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          >
            <Eye size={13} />
            <span className="hidden sm:inline">
              {preview ? "編輯" : "預覽"}
            </span>
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded text-sm border transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              borderColor: "var(--green-border)",
              color: "var(--green)",
            }}
          >
            <Save size={13} />
            <span className="hidden sm:inline">
              {saving ? "儲存中..." : "儲存草稿"}
            </span>
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: "var(--green)", color: "#000" }}
          >
            <Send size={13} />
            <span className="hidden sm:inline">發布</span>
          </button>
          {savedMsg && (
            <span
              className="text-sm font-medium"
              style={{ color: "var(--green)" }}
            >
              {savedMsg}
            </span>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-400 px-1">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
        {/* Editor area */}
        <div className="space-y-4">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章標題..."
            className="w-full bg-transparent text-2xl font-bold border-b pb-3 outline-none"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />

          {/* Toolbar */}
          {!preview && (
            <div
              className="flex items-center gap-0.5 p-1.5 rounded-lg border overflow-x-auto"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              {[
                {
                  icon: Bold,
                  action: () => editor.chain().focus().toggleBold().run(),
                  active: editor.isActive("bold"),
                  title: "粗體",
                },
                {
                  icon: Italic,
                  action: () => editor.chain().focus().toggleItalic().run(),
                  active: editor.isActive("italic"),
                  title: "斜體",
                },
                {
                  icon: Strikethrough,
                  action: () => editor.chain().focus().toggleStrike().run(),
                  active: editor.isActive("strike"),
                  title: "刪除線",
                },
                {
                  icon: Code,
                  action: () => editor.chain().focus().toggleCode().run(),
                  active: editor.isActive("code"),
                  title: "行內程式碼",
                },
              ].map(({ icon: Icon, action, active, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className="p-1.5 rounded transition-colors"
                  style={{
                    background: active ? "var(--green-dim)" : "transparent",
                    color: active ? "var(--green)" : "var(--text-dim)",
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
              <div
                className="w-px h-4 mx-1"
                style={{ background: "var(--border)" }}
              />
              {[
                {
                  icon: Heading2,
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  active: editor.isActive("heading", { level: 2 }),
                  title: "H2",
                },
                {
                  icon: Heading3,
                  action: () =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  active: editor.isActive("heading", { level: 3 }),
                  title: "H3",
                },
                {
                  icon: List,
                  action: () => editor.chain().focus().toggleBulletList().run(),
                  active: editor.isActive("bulletList"),
                  title: "無序清單",
                },
                {
                  icon: ListOrdered,
                  action: () =>
                    editor.chain().focus().toggleOrderedList().run(),
                  active: editor.isActive("orderedList"),
                  title: "有序清單",
                },
                {
                  icon: Quote,
                  action: () => editor.chain().focus().toggleBlockquote().run(),
                  active: editor.isActive("blockquote"),
                  title: "引用",
                },
                {
                  icon: Minus,
                  action: () =>
                    editor.chain().focus().setHorizontalRule().run(),
                  active: false,
                  title: "分隔線",
                },
              ].map(({ icon: Icon, action, active, title }) => (
                <button
                  key={title}
                  onClick={action}
                  title={title}
                  className="p-1.5 rounded transition-colors"
                  style={{
                    background: active ? "var(--green-dim)" : "transparent",
                    color: active ? "var(--green)" : "var(--text-dim)",
                  }}
                >
                  <Icon size={14} />
                </button>
              ))}
              <div
                className="w-px h-4 mx-1"
                style={{ background: "var(--border)" }}
              />
              <button
                onClick={setLink}
                title="連結"
                className="p-1.5 rounded transition-colors"
                style={{
                  color: editor.isActive("link")
                    ? "var(--green)"
                    : "var(--text-dim)",
                }}
              >
                <Link2 size={14} />
              </button>
              <button
                onClick={handleImageUpload}
                title="插入圖片"
                className="p-1.5 rounded"
                style={{ color: "var(--text-dim)" }}
              >
                <ImageIcon size={14} />
              </button>
            </div>
          )}

          {/* Editor / Preview */}
          <div
            className="rounded-xl border p-4 sm:p-5 min-h-[300px] sm:min-h-[480px]"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            {preview ? (
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            ) : (
              <EditorContent editor={editor} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              狀態
            </h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3 py-1.5 text-sm bg-transparent outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <option value="draft">草稿</option>
              <option value="published">已發布</option>
            </select>
          </div>

          {/* Excerpt */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              文章摘要
            </h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="100 字以內摘要..."
              rows={3}
              className="w-full bg-transparent text-sm rounded border px-3 py-2 outline-none resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Cover URL */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              封面圖 URL
            </h3>
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-transparent text-sm rounded border px-3 py-1.5 outline-none"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            />
            {coverUrl && (
              <img
                src={coverUrl}
                alt="cover"
                className="w-full rounded-lg object-cover h-24"
              />
            )}
          </div>

          {/* Categories */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              分類
            </h3>
            <div className="space-y-1.5 max-h-40 overflow-auto">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(c.id)}
                    onChange={(e) => {
                      setSelectedCategories((prev) =>
                        e.target.checked
                          ? [...prev, c.id]
                          : prev.filter((x) => x !== c.id),
                      );
                    }}
                    className="accent-green-500"
                  />
                  <span style={{ color: "var(--text-dim)" }}>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            <h3
              className="text-sm font-medium"
              style={{ color: "var(--text)" }}
            >
              標籤
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const active = selectedTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() =>
                      setSelectedTags((prev) =>
                        active
                          ? prev.filter((x) => x !== t.id)
                          : [...prev, t.id],
                      )
                    }
                    className="px-2 py-0.5 rounded text-xs border transition-colors"
                    style={{
                      borderColor: active ? "var(--green)" : "var(--border)",
                      background: active ? "var(--green-dim)" : "transparent",
                      color: active ? "var(--green)" : "var(--text-dim)",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
