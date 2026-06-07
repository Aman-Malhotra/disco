import { httpClient, postEventStream } from "@/shared/api";

import { sessionDetailSchema, sessionListSchema, sessionSummarySchema } from "../model/chat.schema";

export const chatApi = {
  /** Create an empty conversation; returns the chat_session_id. */
  createSession: () => httpClient.post("/v1/sessions", sessionSummarySchema),

  listSessions: () => httpClient.get("/v1/sessions", sessionListSchema),

  getSession: (id: string) => httpClient.get(`/v1/sessions/${id}`, sessionDetailSchema),

  /** Send a message → SSE stream of workflow states. Yields raw SSE frames. */
  streamChat: (id: string, message: string, signal?: AbortSignal) =>
    postEventStream(`/v1/chat/${id}`, { message }, signal),
};
