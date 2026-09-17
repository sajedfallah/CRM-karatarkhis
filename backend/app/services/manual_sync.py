from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.core import AuditLog, Case, Customer
from app.schemas.manual_sync import ManualSyncBatch, ManualSyncResult


class ManualSyncService:
    def __init__(self, db: Session):
        self.db = db

    def apply(self, payload: ManualSyncBatch, actor_user_id: str) -> ManualSyncResult:
        conflicts: list[str] = []
        customers_imported = customers_skipped = 0
        cases_imported = cases_skipped = 0

        pending_customers: dict[str, Customer] = {}

        for item in payload.customers:
            existing = self.db.get(Customer, item.id)
            if existing is not None:
                if existing.name != item.name or existing.is_active != item.is_active:
                    conflicts.append(f"customer:{item.id}:existing_record_differs")
                customers_skipped += 1
                continue

            pending_customers[item.id] = Customer(
                id=item.id,
                name=item.name,
                is_active=item.is_active,
            )
            customers_imported += 1

        for item in payload.cases:
            existing = self.db.get(Case, item.id)
            if existing is not None:
                if existing.customer_id != item.customer_id or existing.sync_version != item.sync_version:
                    conflicts.append(f"case:{item.id}:existing_record_differs")
                cases_skipped += 1
                continue

            customer = self.db.get(Customer, item.customer_id) or pending_customers.get(item.customer_id)
            if customer is None:
                conflicts.append(f"case:{item.id}:unknown_customer:{item.customer_id}")
                cases_skipped += 1
                continue
            if not customer.is_active:
                conflicts.append(f"case:{item.id}:inactive_customer:{item.customer_id}")
                cases_skipped += 1
                continue

            cases_imported += 1

        if payload.dry_run:
            return ManualSyncResult(
                dry_run=True,
                customers_scanned=len(payload.customers),
                customers_imported=customers_imported,
                customers_skipped=customers_skipped,
                cases_scanned=len(payload.cases),
                cases_imported=cases_imported,
                cases_skipped=cases_skipped,
                conflicts=conflicts,
            )

        try:
            for customer in pending_customers.values():
                self.db.add(customer)
                self.db.add(
                    AuditLog(
                        actor_user_id=actor_user_id,
                        entity_type="customer",
                        entity_id=customer.id,
                        action="manual_import",
                        source="CONTROLLED_SYNC",
                    )
                )

            now = datetime.now(timezone.utc)
            for item in payload.cases:
                if self.db.get(Case, item.id) is not None:
                    continue
                customer = self.db.get(Customer, item.customer_id) or pending_customers.get(item.customer_id)
                if customer is None or not customer.is_active:
                    continue
                case = Case(
                    id=item.id,
                    customer_id=item.customer_id,
                    real_case_number=item.real_case_number,
                    operation_type=item.operation_type,
                    customs=item.customs,
                    status=item.status,
                    sync_version=item.sync_version,
                    sync_source="CONTROLLED_SYNC",
                    sync_updated_at=now,
                    created_by=actor_user_id,
                )
                self.db.add(case)
                self.db.add(
                    AuditLog(
                        actor_user_id=actor_user_id,
                        entity_type="case",
                        entity_id=item.id,
                        action="manual_import",
                        source="CONTROLLED_SYNC",
                    )
                )

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        return ManualSyncResult(
            dry_run=False,
            customers_scanned=len(payload.customers),
            customers_imported=customers_imported,
            customers_skipped=customers_skipped,
            cases_scanned=len(payload.cases),
            cases_imported=cases_imported,
            cases_skipped=cases_skipped,
            conflicts=conflicts,
        )
