export interface Category {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface PostNav {
  title: string;
  slug: string;
}

export interface RelatedPost {
  title: string;
  slug: string;
  published_at: string;
  excerpt: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML string (dev mock) or TipTap JSON (prod)
  cover_url: string | null;
  status: "draft" | "published";
  published_at: string;
  categories: Category[];
  tags: Tag[];
  prev_post?: PostNav | null;
  next_post?: PostNav | null;
  related_posts?: RelatedPost[];
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  per_page: number;
}

export interface ArchiveEntry {
  year: number;
  month: number;
  label: string;
  count: number;
}

export interface ArchiveGroup {
  year: number;
  months: ArchiveEntry[];
}
