from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditLog


def write_audit_log(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    ip: str | None = None,
    meta: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip=ip,
        meta=meta,
    )
    db.add(log)
    return log
