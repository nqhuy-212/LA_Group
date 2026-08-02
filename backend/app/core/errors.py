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
    # Pydantic v2 nhét object exception gốc (không serialize được JSON) vào "ctx" khi
    # một @field_validator raise ValueError thường (ví dụ so sánh salary_min/max) —
    # bỏ "ctx" đi, "msg" đã có sẵn thông điệp lỗi dạng chuỗi, không mất thông tin.
    fields = [{k: v for k, v in err.items() if k != "ctx"} for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"error": {"message": "Dữ liệu gửi lên không hợp lệ", "fields": fields}},
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Không bao giờ trả traceback/tên bảng DB ra response — chỉ log nội bộ.
    logger.exception("Unhandled exception xử lý %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": {"message": "Đã có lỗi xảy ra, vui lòng thử lại sau."}},
    )
