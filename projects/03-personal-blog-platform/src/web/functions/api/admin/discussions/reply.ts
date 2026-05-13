import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../../_types";
import { json, requireAdmin } from "../_auth";

const REPO_OWNER = "anson4139";
const REPO_NAME = "PersonalWorkFlow";

// POST /api/admin/discussions/reply
// Body: { discussionId: string, body: string, replyToId?: string }
//   - discussionId: GitHub Discussion node ID（必填）
//   - body: 回覆內容 Markdown（必填）
//   - replyToId: 要回覆的留言 node ID（選填；不填則為頂層留言）
export async function onRequest(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;
  if (request.method !== "POST")
    return json({ error: "Method Not Allowed" }, 405);

  if (!env.GITHUB_PAT) {
    return json({ error: "GITHUB_PAT not configured" }, 500);
  }

  let discussionId: string;
  let body: string;
  let replyToId: string | undefined;

  try {
    const payload = (await request.json()) as {
      discussionId?: unknown;
      body?: unknown;
      replyToId?: unknown;
    };
    if (
      typeof payload.discussionId !== "string" ||
      !payload.discussionId.trim()
    ) {
      return json({ error: "discussionId is required" }, 400);
    }
    if (typeof payload.body !== "string" || !payload.body.trim()) {
      return json({ error: "body is required" }, 400);
    }
    discussionId = payload.discussionId.trim();
    body = payload.body.trim();
    replyToId =
      typeof payload.replyToId === "string" && payload.replyToId.trim()
        ? payload.replyToId.trim()
        : undefined;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const mutation = `
    mutation($discussionId: ID!, $body: String!${replyToId ? ", $replyToId: ID" : ""}) {
      addDiscussionComment(input: {
        discussionId: $discussionId,
        body: $body${replyToId ? ", replyToId: $replyToId" : ""}
      }) {
        comment {
          id
          body
          createdAt
          url
          author {
            login
            avatarUrl
          }
        }
      }
    }
  `;

  const variables: Record<string, string> = { discussionId, body };
  if (replyToId) variables.replyToId = replyToId;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        "Content-Type": "application/json",
        "User-Agent": "personal-blog-platform",
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const data = (await res.json()) as {
      data?: { addDiscussionComment?: { comment: object } };
      errors?: { message: string }[];
    };

    if (data.errors?.length) {
      // write:discussion scope 不足時，errors[0].message 會說明
      return json({ error: data.errors[0].message }, 400);
    }

    return json(
      { ok: true, comment: data.data?.addDiscussionComment?.comment },
      201,
    );
  } catch (e) {
    return json({ error: String(e) }, 500);
  }

  // suppress TS unreachable warning for unused imports
  void REPO_OWNER;
  void REPO_NAME;
}
