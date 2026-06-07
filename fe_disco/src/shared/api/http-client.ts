import { z } from "zod";

import { env } from "@/app/config/env";

import { ApiError, type ApiErrorBody } from "./api-error";

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    let code = "http_error";
    let message = response.statusText;
    let details: Record<string, unknown> = {};
    try {
      const data = (await response.json()) as ApiErrorBody;
      code = data.error?.code ?? code;
      message = data.error?.message ?? message;
      details = data.error?.details ?? {};
    } catch {
      // non-JSON error body
    }
    throw new ApiError(response.status, code, message, details);
  }

  if (response.status === 204) return schema.parse(undefined);
  const json = await response.json();
  return schema.parse(json);
}

export const httpClient = {
  get: <T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal) =>
    request(path, schema, { signal }),
  post: <T>(path: string, schema: z.ZodType<T>, body?: unknown, signal?: AbortSignal) =>
    request(path, schema, { method: "POST", body, signal }),
};
