from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.integrations.google_sheets import GoogleSheetsClient
from app.models.core import AuditLog, Case


CASE_SHEET = "پرونده‌ها"
HEADERS = {
    "Case ID": 0,
    "مشتری": 2,
    "نوع عملیات": 3,
    "گمرک": 4,
    "شماره پرونده واقعی": 5,
    "وضعیت": 6,
    "Customer ID": 28,
    "Sync Version": 29,
    "Sync Source": 30,
    "Sync Updated At": 31,
}


@dataclass
class SyncResult:
    scanned: int = 0
    imported: int = 0
    skipped: int = 0
    conflicts: int = 0


class CaseSheetSyncService:
    """Safe first-stage Sheet -> DB case sync.

    It refuses rows without immutable Case ID and Customer ID. The DB remains
    authoritative once a row has been imported. Bidirectional field mutation is
    deliberately not enabled until conflict policy is complete.
    """

    def __init__(self, db: Session, sheets: GoogleSheetsClient, spreadsheet_id: str):
        self.db = db
        self.sheets = sheets
        self.spreadsheet_id = spreadsheet_id

    def import_new_cases(self) -> SyncResult:
        rows = self.sheets.read_values(self.spreadsheet_id, f"{CASE_SHEET}!A2:AF1000")
        result = SyncResult()
        imported_rows: list[tuple[int, str]] = []

        try:
            for offset, row in enumerate(rows, start=2):
                result.scanned += 1
                case_id = self._value(row, "Case ID")
                customer_id = self._value(row, "Customer ID")
                if not case_id or not customer_id:
                    result.skipped += 1
                    continue

                case_id_text = str(case_id)
                if self.db.get(Case, case_id_text) is not None:
                    result.skipped += 1
                    continue

                case = Case(
                    id=case_id_text,
                    customer_id=str(customer_id),
                    real_case_number=self._optional(row, "شماره پرونده واقعی"),
                    operation_type=str(self._value(row, "نوع عملیات") or ""),
                    customs=str(self._value(row, "گمرک") or ""),
                    status=str(self._value(row, "وضعیت") or "پیش‌نویس"),
                )
                self.db.add(case)
                self.db.add(
                    AuditLog(
                        actor_user_id=None,
                        entity_type="case",
                        entity_id=case_id_text,
                        action="imported",
                        field_name=None,
                        old_value=None,
                        new_value=None,
                        source="SHEET_SYNC",
                    )
                )
                imported_rows.append((offset, case_id_text))
                result.imported += 1

            # Commit the database first. Sheet metadata is written only after the
            # authoritative DB transaction succeeds, preventing false "synced"
            # markers when a database commit fails.
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise

        sync_timestamp = datetime.now(timezone.utc).isoformat()
        for row_number, _case_id in imported_rows:
            self.sheets.update_values(
                self.spreadsheet_id,
                f"{CASE_SHEET}!AD{row_number}:AF{row_number}",
                [[1, "SHEET_IMPORT", sync_timestamp]],
            )

        return result

    @staticmethod
    def _value(row: list[object], header: str) -> object | None:
        index = HEADERS[header]
        return row[index] if index < len(row) else None

    @classmethod
    def _optional(cls, row: list[object], header: str) -> str | None:
        value = cls._value(row, header)
        return None if value in (None, "") else str(value)
