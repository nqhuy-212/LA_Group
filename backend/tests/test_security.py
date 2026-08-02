import io
import time

import jwt
import pytest

from app.core.security import (
    InvalidTokenError,
    create_access_token,
    decode_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.storage import (
    FileTooLargeError,
    UnsupportedFileTypeError,
    save_upload_stream,
    upload_root,
)

PDF_HEADER = b"%PDF-1.4\n%comment\n" + b"0" * 200
PNG_HEADER = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) + b"0" * 200


def test_hash_password_and_verify_roundtrip():
    hashed = hash_password("mat-khau-that-cua-toi")
    assert verify_password("mat-khau-that-cua-toi", hashed)
    assert not verify_password("mat-khau-sai", hashed)


def test_hash_password_rejects_over_72_bytes():
    with pytest.raises(ValueError):
        hash_password("a" * 80)


def test_verify_password_malformed_hash_returns_false_not_raise():
    assert verify_password("bat-ky-gi", "khong-phai-bcrypt-hash") is False


def test_access_token_roundtrip():
    token = create_access_token(user_id=42, role="admin")
    payload = decode_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_decode_token_rejects_tampered_signature():
    token = create_access_token(user_id=1, role="staff")
    tampered = token[:-4] + ("A" * 4 if token[-4:] != "AAAA" else "BBBB")
    with pytest.raises(InvalidTokenError):
        decode_token(tampered)


def test_decode_token_rejects_expired(monkeypatch):
    import app.core.security as security_module

    monkeypatch.setattr(security_module.settings, "access_token_expire_minutes", -1)
    token = create_access_token(user_id=1, role="staff")
    time.sleep(1)
    with pytest.raises(security_module.InvalidTokenError):
        decode_token(token)


def test_refresh_token_hash_is_deterministic_and_not_reversible():
    raw = generate_refresh_token()
    assert hash_refresh_token(raw) == hash_refresh_token(raw)
    assert hash_refresh_token(raw) != raw


def test_storage_rejects_unsupported_file_type(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))
    fake_exe_renamed_as_pdf = io.BytesIO(b"MZ\x90\x00" + b"0" * 200)
    with pytest.raises(UnsupportedFileTypeError):
        save_upload_stream(fake_exe_renamed_as_pdf)
    assert list(tmp_path.rglob("*")) == []


def test_storage_saves_valid_pdf_with_uuid_filename(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))
    saved = save_upload_stream(io.BytesIO(PDF_HEADER))
    assert saved.extension == "pdf"
    assert saved.mime == "application/pdf"
    assert saved.absolute_path.exists()
    assert saved.absolute_path.suffix == ".pdf"
    assert saved.absolute_path.stem  # uuid4, không liên quan filename gốc
    assert saved.absolute_path.is_relative_to(upload_root())


def test_storage_rejects_oversized_file_before_full_write(tmp_path, monkeypatch):
    monkeypatch.setattr("app.core.storage.settings.upload_dir", str(tmp_path))
    monkeypatch.setattr("app.core.storage.settings.max_upload_bytes", 1024)
    oversized = io.BytesIO(PNG_HEADER + b"1" * (5 * 1024 * 1024))  # ~5MB, giới hạn test 1KB

    with pytest.raises(FileTooLargeError):
        save_upload_stream(oversized)

    # Không được để lại file dở dang nào trên đĩa sau khi từ chối.
    assert list(tmp_path.rglob("*.png")) == []


def test_jwt_secret_mismatch_is_rejected():
    token = create_access_token(user_id=1, role="staff")
    with pytest.raises(jwt.PyJWTError):
        jwt.decode(token, "sai-secret-key", algorithms=["HS256"])
