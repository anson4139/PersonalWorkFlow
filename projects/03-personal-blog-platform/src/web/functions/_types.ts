export interface Env {
  BLOG_DB: D1Database;
  BLOG_IMAGES?: R2Bucket; // 需先在 CF Dashboard 啟用 R2
  OPENAI_API_KEY?: string; // OpenAI API Key
  MSSQL_BRIDGE_URL?: string; // MSSQL 中介 API URL
  MSSQL_BRIDGE_SECRET?: string; // MSSQL 中介 API Bearer token
  ADMIN_SECRET?: string; // 後台管理密鑰（無 CF Access / OAuth 時使用）
  GOOGLE_CLIENT_ID?: string; // Google OAuth 2.0 Client ID
  GITHUB_PAT?: string; // GitHub PAT（public_repo scope），用於查 Giscus Discussions 留言數
}
