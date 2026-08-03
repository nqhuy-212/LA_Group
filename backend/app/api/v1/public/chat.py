from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.rate_limit import limiter
from app.schemas.chat import ChatRequest
from app.services import chat_service

router = APIRouter(prefix="/api", tags=["chat"])

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    # Nginx mặc định buffer response proxy — phải tắt riêng cho route SSE này ở
    # prod (D5), nếu không người dùng sẽ không thấy chữ chạy dần theo stream.
    "X-Accel-Buffering": "no",
}


@router.post("/chat")
@limiter.limit("10/10minutes")
async def chat(request: Request, payload: ChatRequest) -> StreamingResponse:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Chatbot chưa được cấu hình"
        )

    if not chat_service.has_budget():
        return StreamingResponse(
            chat_service.fallback_stream(), media_type="text/event-stream", headers=_SSE_HEADERS
        )

    return StreamingResponse(
        chat_service.stream_chat(payload.message, payload.history),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )
