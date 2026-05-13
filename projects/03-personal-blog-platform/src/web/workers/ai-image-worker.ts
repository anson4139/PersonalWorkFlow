import type { AiImageJobMessage, Env } from "../functions/_types";
import { processImageJobById } from "../functions/api/admin/_ai-image-jobs";

export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      try {
        await processImageJobById(env, message.body.job_id);
        message.ack();
      } catch (error) {
        console.error(
          `[ai-image-worker] job failed job_id=${message.body.job_id}: ${String(error)}`,
        );
        message.ack();
      }
    }
  },
} satisfies ExportedHandler<Env, AiImageJobMessage>;
