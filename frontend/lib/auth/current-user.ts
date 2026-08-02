import { cache } from "react";
import { serverFetchAuthed } from "@/lib/api/server-auth-client";
import type { components } from "@/lib/api/schema";

export type MeResponseDTO = components["schemas"]["MeResponse"];

/**
 * `cache()` của React dedupe các lệnh gọi trong cùng một request — layout và các
 * page/component con đều có thể tự gọi hàm này mà chỉ tốn đúng 1 lần round-trip
 * tới `/api/auth/me` cho mỗi request (mẫu Data Access Layer theo Next.js docs).
 */
export const getCurrentUser = cache(async (): Promise<MeResponseDTO | null> => {
  const res = await serverFetchAuthed<MeResponseDTO>("/api/auth/me");
  return res.ok ? res.data : null;
});
