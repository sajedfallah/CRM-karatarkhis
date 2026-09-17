import argparse

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.integrations.google_sheets import GoogleSheetsClient
from app.services.case_customer_resolver import CaseCustomerResolver
from app.services.case_sheet_sync import CaseSheetSyncService
from app.services.customer_sheet_sync import CustomerSheetSyncService


def _client() -> tuple[GoogleSheetsClient, str]:
    settings = get_settings()
    if not settings.google_spreadsheet_id:
        raise SystemExit("GOOGLE_SPREADSHEET_ID is required")
    if not settings.google_service_account_file:
        raise SystemExit("GOOGLE_SERVICE_ACCOUNT_FILE is required")
    return GoogleSheetsClient(settings.google_service_account_file), settings.google_spreadsheet_id


def main() -> None:
    parser = argparse.ArgumentParser(description="Karatarkhis CRM V1.5 sync operations")
    sub = parser.add_subparsers(dest="command", required=True)

    resolve = sub.add_parser("resolve-case-customers")
    resolve.add_argument("--apply", action="store_true", help="write resolved Customer IDs to Sheet")

    sub.add_parser("import-customers")
    sub.add_parser("import-cases")
    args = parser.parse_args()

    sheets, spreadsheet_id = _client()

    if args.command == "resolve-case-customers":
        result = CaseCustomerResolver(sheets, spreadsheet_id).resolve(dry_run=not args.apply)
        print(result)
        return

    with SessionLocal() as db:
        if args.command == "import-customers":
            print(CustomerSheetSyncService(db, sheets, spreadsheet_id).import_customers())
        elif args.command == "import-cases":
            print(CaseSheetSyncService(db, sheets, spreadsheet_id).import_new_cases())


if __name__ == "__main__":
    main()
