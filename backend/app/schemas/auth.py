from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_max_72_bytes(cls, value: str) -> str:
        # D2: bcrypt cắt ở 72 byte — chặn ngay ở schema để không silent-truncate.
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Mật khẩu tối đa 72 byte")
        return value


class MeResponse(BaseModel):
    id: int
    email: str
    role: str
