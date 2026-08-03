from typing import Literal

from pydantic import BaseModel, Field

MAX_HISTORY_TURNS = 20
MAX_MESSAGE_LENGTH = 1000


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=MAX_MESSAGE_LENGTH)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_LENGTH)
    # Lịch sử hội thoại do client gửi lại mỗi lần (server không lưu session) —
    # giới hạn số lượt để tránh một hội thoại kéo dài vô hạn đốt token.
    history: list[ChatMessageIn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)
