from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.admin.applications import router as admin_applications_router
from app.api.v1.admin.companies import router as admin_companies_router
from app.api.v1.admin.jobs import router as admin_jobs_router
from app.api.v1.admin.posts import router as admin_posts_router
from app.api.v1.admin.stats import router as admin_stats_router
from app.api.v1.admin.users import router as admin_users_router
from app.api.v1.auth import router as auth_router
from app.api.v1.public.applications import router as applications_router
from app.api.v1.public.chat import router as chat_router
from app.api.v1.public.companies import router as companies_router
from app.api.v1.public.jobs import router as jobs_router
from app.api.v1.public.posts import router as posts_router
from app.api.v1.public.taxonomies import router as taxonomies_router
from app.core.config import settings
from app.core.errors import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.rate_limit import limiter

_is_prod = settings.environment == "prod"

app = FastAPI(
    title="LA Group API",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    return response


app.include_router(auth_router)
app.include_router(applications_router)
app.include_router(chat_router)
app.include_router(companies_router)
app.include_router(jobs_router)
app.include_router(posts_router)
app.include_router(taxonomies_router)
app.include_router(admin_jobs_router)
app.include_router(admin_posts_router)
app.include_router(admin_companies_router)
app.include_router(admin_applications_router)
app.include_router(admin_stats_router)
app.include_router(admin_users_router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
