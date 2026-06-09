import { useQuery } from "@tanstack/react-query";

import { chatApi } from "./chat.service";

export const chatKeys = {
  all: ["sessions"] as const,
  list: () => [...chatKeys.all, "list"] as const,
  detail: (id: string) => [...chatKeys.all, "detail", id] as const,
};

/** Conversation list — fetched on mount (i.e. every page load/refresh). */
export function useSessions() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => chatApi.listSessions(),
  });
}

export function useSession(id: string | null) {
  return useQuery({
    queryKey: chatKeys.detail(id ?? "none"),
    queryFn: () => chatApi.getSession(id as string),
    enabled: Boolean(id),
    // If the last message is an unanswered user turn, a turn is still running
    // (e.g. the page was refreshed mid-stream). Poll until the assistant reply
    // lands, then stop.
    refetchInterval: (query) => {
      const messages = query.state.data?.messages ?? [];
      const last = messages[messages.length - 1];
      return last && last.role === "user" ? 2500 : false;
    },
  });
}
