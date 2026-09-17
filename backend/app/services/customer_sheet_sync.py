from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.integrations.google_sheets import GoogleSheetsClient
from app.models.core import Customer


CUSTOMER_SHEET = "مشتریان"


@dataclass
class CustomerSyncResult:
    scanned: int = 0
    imported: int = 0
    skipped: int = 0


class CustomerSheetSyncService:
    """Bootstrap immutable Customer IDs from CRM V1.5 into PostgreSQL."""

    def __init__(self, db: Session, sheets: GoogleSheetsClient, spreadsheet_id: str):
        self.db = db
        self.sheets = sheets
        self.spreadsheet_id = spreadsheet_id

    def import_customers(self) -> CustomerSyncResult:
        rows = self.sheets.read_values(self.spreadsheet_id, f"{CUSTOMER_SHEET}!A2:T1000")
        result = CustomerSyncResult()
        for row in rows:
            result.scanned += 1
            customer_id = row[0] if len(row) > 0 else None
            name = row[2] if len(row) > 2 else None
            active = row[19] if len(row) > 19 else True
            if not customer_id or not name:
                result.skipped += 1
                continue
            if self.db.get(Customer, str(customer_id)) is not None:
                result.skipped += 1
                continue
            self.db.add(Customer(id=str(customer_id), name=str(name), is_active=bool(active)))
            result.imported += 1
        self.db.commit()
        return result
