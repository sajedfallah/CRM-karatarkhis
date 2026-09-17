from fastapi import APIRouter

from app.api.v1.cases import router as cases_router
from app.api.v1.manual_sync import router as manual_sync_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.users import router as users_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(cases_router)
api_router.include_router(manual_sync_router)
api_router.include_router(tasks_router)
api_router.include_router(users_router)
