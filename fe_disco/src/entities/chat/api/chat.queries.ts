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
  });
}
