// POST /api/auth/logout
// Client handles GIS revoke; this endpoint just returns 200 for consistency.
export const onRequestPost: PagesFunction = async () => {
  return Response.json({ ok: true });
};
