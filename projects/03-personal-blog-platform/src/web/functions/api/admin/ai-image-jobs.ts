import type { EventContext } from "@cloudflare/workers-types";
import type { Env } from "../../_types";
import { getImageJob, publicJob } from "./_ai-image-jobs";
import { json, requireAdmin } from "./_auth";

export async function onRequestGet(
  ctx: EventContext<Env, never, Record<string, unknown>>,
) {
  const { request, env } = ctx;
  const deny = await requireAdmin(request, env);
  if (deny) return deny;

  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id")?.trim() ?? "";
  if (!jobId) return json({ error: "job_id required" }, 400);

  const row = await getImageJob(env, jobId);
  if (!row) return json({ error: "job not found" }, 404);
  return json(publicJob(row));
}
