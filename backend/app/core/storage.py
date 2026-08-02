import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import BinaryIO

import filetype

from app.core.config import settings

BACKEND_DIR = Path(__file__).resolve().parents[2]

_ALLOWED_EXTENSIONS = {"pdf", "jpg", "png"}
_CHUNK_SIZE = 64 * 1024


class UnsupportedFileTypeError(ValueError):
    pass


class FileTooLargeError(ValueError):
    pass


@dataclass
class SavedFile:
    relative_path: str
    absolute_path: Path
    mime: str
    extension: str
    size: int


def upload_root() -> Path:
    configured = Path(settings.upload_dir)
    if configured.is_absolute():
        return configured
    return (BACKEND_DIR / configured).resolve()


def save_upload_stream(stream: BinaryIO, subdir: str = "cv") -> SavedFile:
    """Lưu file upload an toàn.

    - Không bao giờ tin `filename`/`Content-Type` client gửi — loại file xác định
      bằng cách sniff magic bytes (thư viện `filetype`).
    - Chặn dung lượng THEO STREAM: kiểm tra ngay trong lúc đọc từng chunk, dừng và
      xoá file dở dang ngay khi vượt hạn mức — không đọc hết toàn bộ nội dung trước
      rồi mới kiểm tra kích thước.
    - Tên file lưu trên đĩa luôn là uuid4 sinh mới, không liên quan gì tới tên file
      gốc (chống path traversal / ghi đè file).
    """
    head = stream.read(_CHUNK_SIZE)
    kind = filetype.guess(head)
    if kind is None or kind.extension not in _ALLOWED_EXTENSIONS:
        raise UnsupportedFileTypeError("Chỉ chấp nhận file PDF, JPG hoặc PNG")

    now = datetime.now(UTC)
    target_dir = upload_root() / subdir / f"{now:%Y}" / f"{now:%m}"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{uuid.uuid4()}.{kind.extension}"

    total_size = 0
    try:
        with target_path.open("wb") as out:
            chunk = head
            while chunk:
                total_size += len(chunk)
                if total_size > settings.max_upload_bytes:
                    raise FileTooLargeError(
                        f"File vượt quá giới hạn {settings.max_upload_bytes} byte"
                    )
                out.write(chunk)
                chunk = stream.read(_CHUNK_SIZE)
    except FileTooLargeError:
        target_path.unlink(missing_ok=True)
        raise

    return SavedFile(
        relative_path=str(target_path.relative_to(upload_root())),
        absolute_path=target_path,
        mime=kind.mime,
        extension=kind.extension,
        size=total_size,
    )


def save_upload_file(upload_file, subdir: str = "cv") -> SavedFile:
    return save_upload_stream(upload_file.file, subdir=subdir)
