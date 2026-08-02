const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:8000";
const DEFAULT_REVALIDATE_SECONDS = 300;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ServerFetchInit = RequestInit & { revalidate?: number | false };

export async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return body?.error?.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Chỉ gọi từ Server Component/Server Action — dùng `INTERNAL_API_URL` (địa chỉ nội
 * bộ tới FastAPI, không public qua Nginx). KHÔNG import hàm này vào Client Component
 * (biến `INTERNAL_API_URL` không có tiền tố `NEXT_PUBLIC_` nên sẽ luôn là undefined
 * phía client — dùng nhầm sẽ gọi lỗi thay vì lộ URL nội bộ, nhưng vẫn nên tránh).
 */
export async function serverFetch<T>(
  path: string,
  init?: ServerFetchInit,
): Promise<ApiResult<T>> {
  const { revalidate = DEFAULT_REVALIDATE_SECONDS, ...rest } = init ?? {};
  try {
    const res = await fetch(`${INTERNAL_API_URL}${path}`, {
      ...rest,
      ...(revalidate === false
        ? { cache: "no-store" as const }
        : { next: { revalidate } }),
    });
    if (!res.ok) {
      return { ok: false, error: await parseErrorMessage(res) };
    }
    if (res.status === 204) {
      return { ok: true, data: undefined as T };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "network-error" };
  }
}

/**
 * Gọi từ Client Component — dùng path tương đối `/api/...`. Nhờ D5 (một origin qua
 * Nginx ở production; `next.config.ts` `rewrites()` mô phỏng ở dev) nên không cần
 * biết địa chỉ backend thật, không cần `NEXT_PUBLIC_API_URL`. Cookie phiên đăng
 * nhập được trình duyệt tự đính kèm (cùng origin), không cần xử lý gì thêm.
 */
export async function browserFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, init);
    if (!res.ok) {
      return { ok: false, error: await parseErrorMessage(res) };
    }
    if (res.status === 204) {
      return { ok: true, data: undefined as T };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, error: "network-error" };
  }
}
