from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.models.core import Case, Customer
from app.services.drive_provisioning import DriveProvisioningService

router = APIRouter(prefix="/drive", tags=["drive"])


@router.post("/provision")
def provision_all(db: DbSession, current_user: CurrentUser) -> dict[str, int]:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_required")

    customers = list(db.scalars(select(Customer).order_by(Customer.id)))
    cases = list(db.scalars(select(Case).order_by(Case.id)))
    customer_ok = customer_failed = case_ok = case_failed = 0

    try:
        service = DriveProvisioningService(db)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    for customer in customers:
        try:
            service.provision_customer(customer)
            customer_ok += 1
        except Exception:
            customer_failed += 1
        db.commit()

    by_customer = {customer.id: customer for customer in customers}
    for case in cases:
        customer = by_customer.get(case.customer_id) or db.get(Customer, case.customer_id)
        if customer is None:
            case.drive_provisioning_status = "error"
            case.drive_provisioning_error = "customer_not_found"
            case_failed += 1
            db.commit()
            continue
        try:
            service.provision_case(case, customer)
            case_ok += 1
        except Exception:
            case_failed += 1
        db.commit()

    return {
        "customers_ready": customer_ok,
        "customers_failed": customer_failed,
        "cases_ready": case_ok,
        "cases_failed": case_failed,
    }
