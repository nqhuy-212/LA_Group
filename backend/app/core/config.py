from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

    environment: Literal["dev", "staging", "prod"] = "dev"

    database_url: str = "postgresql+psycopg2://lagroup:lagroup@localhost:5432/lagroup"
    cors_origins: list[str] = ["http://localhost:3000"]

    jwt_secret_key: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 20
    refresh_token_expire_days: int = 7

    anthropic_api_key: str = ""
    # Haiku 4.5: đủ tốt cho tư vấn viên việc làm bám RAG (tool search_jobs cung cấp
    # sẵn dữ liệu thật), rẻ hơn nhiều so với Opus/Sonnet — phù hợp mô hình không có
    # ngân sách ads lớn của LAHR (xem company-info.md). Chốt ở P8, xem CLAUDE.md.
    chat_model: str = "claude-haiku-4-5-20251001"
    chat_daily_token_budget: int = 200_000

    upload_dir: str = "../uploads"
    max_upload_bytes: int = 5 * 1024 * 1024

    n8n_webhook_url: str = ""
    public_site_url: str = "http://localhost:3000"

    @model_validator(mode="after")
    def check_prod_safety(self) -> "Settings":
        if self.environment == "prod":
            if self.jwt_secret_key == "change-me":
                raise ValueError(
                    "jwt_secret_key phải được đổi trước khi chạy ở môi trường prod"
                )
            has_localhost = any(
                "localhost" in origin or "127.0.0.1" in origin for origin in self.cors_origins
            )
            if has_localhost:
                raise ValueError(
                    "cors_origins không được chứa localhost/127.0.0.1 ở môi trường prod"
                )
        return self


settings = Settings()
