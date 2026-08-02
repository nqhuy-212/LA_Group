import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 đổi tên "Middleware" thành "Proxy" (xem frontend/AGENTS.md — hành vi
// không đổi, chỉ đổi tên file + convention). Đây là lớp chặn "optimistic" thứ nhất
// (security.md/feature-admin-dashboard.md): chỉ kiểm tra cookie access_token có tồn
// tại hay không, KHÔNG verify chữ ký/hết hạn (Proxy không nên tự tay decode JWT bằng
// secret — đó là việc của FastAPI). Lớp thật sự (bắt buộc, không thể bỏ qua) vẫn là
// `Depends(get_current_user)`/`require_roles(...)` ở từng endpoint FastAPI: một
// cookie tồn tại nhưng hết hạn/sai vẫn qua được Proxy này, nhưng request gọi API
// admin thật sẽ bị 401/403 ngay khi tới backend.
const ACCESS_TOKEN_COOKIE = "access_token";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(ACCESS_TOKEN_COOKIE);
  const { pathname } = request.nextUrl;

  if (!hasSession) {
    const loginUrl = new URL("/dang-nhap", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
