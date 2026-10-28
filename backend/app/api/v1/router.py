from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.cases import router as cases_router
from app.api.v1.customers import router as customers_router
from app.api.v1.documents import router as documents_router
from app.api.v1.drive import router as drive_router
from app.api.v1.manual_sync import router as manual_sync_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.telegram import router as telegram_router
from app.api.v1.users import router as users_router
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router

from app.api.v1.compliance import router as compliance_router

from app.api.v1.drafts import router as drafts_router

from app.api.v1.declarations import router as declarations_router

from app.api.v1.customer_portal import router as customer_portal_router
from app.api.v1.case_registration_requests import router as case_registration_requests_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(customer_portal_router)
api_router.include_router(case_registration_requests_router)
api_router.include_router(declarations_router)
api_router.include_router(drafts_router)
api_router.include_router(compliance_router)
api_router.include_router(auth_router)
api_router.include_router(organizations_router)
api_router.include_router(admin_router)
api_router.include_router(cases_router)
api_router.include_router(customers_router)
api_router.include_router(documents_router)
api_router.include_router(drive_router)
api_router.include_router(manual_sync_router)
api_router.include_router(tasks_router)
api_router.include_router(telegram_router)
api_router.include_router(users_router)

