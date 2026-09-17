from datetime import datetime, timezone

from app.core.config import get_settings
from app.integrations.google_sheets import GoogleSheetsClient
from app.models.core import Customer, User


class SheetMirrorService:
    """Best-effort projection from PostgreSQL source-of-truth into the operational CRM Sheet."""

    def __init__(self):
        settings = get_settings()
        if not settings.google_spreadsheet_id:
            raise RuntimeError("google_spreadsheet_not_configured")
        self.spreadsheet_id = settings.google_spreadsheet_id
        self.client = GoogleSheetsClient(
            credentials_file=settings.google_service_account_file,
            credentials_json=settings.google_service_account_json,
            credentials_json_b64=settings.google_service_account_json_b64,
        )

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    def upsert_employee(self, user: User, *, actor: str = "Telegram Admin") -> None:
        now = self._now()
        user_row = [
            user.id,
            user.full_name,
            user.mobile or "",
            user.email or "",
            user.telegram_user_id or "",
            user.role,
            user.customer_id or "",
            "",
            user.permission_profile,
            "فعال" if user.is_active else "غیرفعال",
            user.workspace_url or "",
            "",
            "TRUE" if user.telegram_user_id else "FALSE",
            actor,
            now,
            now,
            now,
            "AUTO_SYNC_FROM_V5",
        ]
        self.client.upsert_row_by_first_column(
            self.spreadsheet_id,
            "Users",
            user.id,
            user_row,
            end_column="R",
            start_row=2,
        )
        self._upsert_legacy_employee(user)

    def _upsert_legacy_employee(self, user: User) -> None:
        rows = self.client.read_values(self.spreadsheet_id, "'کارمندان'!A2:E100")
        target_row = None
        first_empty = None
        for offset, row in enumerate(rows, start=2):
            if not row:
                if first_empty is None:
                    first_empty = offset
                continue
            telegram_id = str(row[1]).strip() if len(row) > 1 else ""
            if telegram_id == str(user.telegram_user_id or ""):
                target_row = offset
                break
        if target_row is None:
            target_row = first_empty or (2 + len(rows))
        self.client.update_values(
            self.spreadsheet_id,
            f"'کارمندان'!A{target_row}:E{target_row}",
            [[
                user.full_name,
                user.telegram_user_id or "",
                "کارمند" if user.role == "internal_employee" else "مدیر",
                "TRUE" if user.is_active else "FALSE",
                "",
            ]],
        )

    def delete_employee(self, user: User) -> None:
        row = self.client.find_row_by_first_column(self.spreadsheet_id, "Users", user.id, start_row=2)
        if row is not None:
            self.client.clear_values(self.spreadsheet_id, f"'Users'!A{row}:R{row}")
        rows = self.client.read_values(self.spreadsheet_id, "'کارمندان'!A2:E100")
        for offset, legacy_row in enumerate(rows, start=2):
            telegram_id = str(legacy_row[1]).strip() if len(legacy_row) > 1 else ""
            if telegram_id == str(user.telegram_user_id or ""):
                self.client.clear_values(self.spreadsheet_id, f"'کارمندان'!A{offset}:E{offset}")
                break

    def upsert_customer(self, customer: Customer, *, actor: str = "Telegram Admin") -> None:
        now = self._now()
        folder_url = (
            f"https://drive.google.com/drive/folders/{customer.drive_folder_id}"
            if customer.drive_folder_id
            else ""
        )
        row = [
            customer.id,
            "حقوقی",
            customer.name,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            folder_url,
            "",
            "",
            "TRUE" if customer.is_active else "FALSE",
            now,
            f"AUTO_SYNC_FROM_V5 | {actor}",
            "",
            "",
            "",
            "",
            "",
            "",
        ]
        self.client.upsert_row_by_first_column(
            self.spreadsheet_id,
            "مشتریان",
            customer.id,
            row,
            end_column="AC",
            start_row=2,
        )

    def delete_customer(self, customer: Customer) -> None:
        row = self.client.find_row_by_first_column(self.spreadsheet_id, "مشتریان", customer.id, start_row=2)
        if row is not None:
            self.client.clear_values(self.spreadsheet_id, f"'مشتریان'!A{row}:AC{row}")
