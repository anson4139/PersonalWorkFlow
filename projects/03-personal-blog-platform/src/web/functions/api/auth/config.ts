import type { Env } from "../../_types";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({
    googleClientId: env.GOOGLE_CLIENT_ID ?? null,
  });
};
