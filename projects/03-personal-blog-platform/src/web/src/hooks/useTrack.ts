/**
 * useTrack — behaviour event hook.
 * Only fires for logged-in users.
 * Silently no-ops for anonymous visitors.
 */

import { useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

type TrackAction =
  | "page_view"
  | "category_click"
  | "search"
  | "admin_action"
  | "ai_generate"
  | "login"
  | "logout";

export function useTrack() {
  const { user } = useAuth();

  const track = useCallback(
    async (
      action: TrackAction,
      page?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!user) return; // anonymous — skip

      try {
        await fetch("/api/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.idToken}`,
          },
          body: JSON.stringify({ action, page, metadata }),
        });
      } catch {
        // Best-effort; ignore network errors
      }
    },
    [user],
  );

  return track;
}
