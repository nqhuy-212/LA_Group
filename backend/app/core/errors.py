import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

logger = logging.getLogger("app.errors")


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": {"message": exc.detail}})


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"error": {"message": "Dữ liệu gửi lên không hợp lệ", "fields": exc.errors()}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Không bao giờ trả traceback/tên bảng DB ra response — chỉ log nội bộ.
    logger.exception("Unhandled exception xử lý %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"message": "Đã có lỗi xảy ra, vui lòng thử lại sau."}},
    )
