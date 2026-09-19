from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.models.core import UserRole
from app.schemas.manual_sync import ManualSyncBatch, ManualSyncResult
from app.services.manual_sync import ManualSyncService


router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/manual", response_model=ManualSyncResult)
def manual_sync(payload: ManualSyncBatch, db: DbSession, current_user: CurrentUser) -> ManualSyncResult:
    if current_user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_required")
    return ManualSyncService(db).apply(payload, actor_user_id=current_user.id)
