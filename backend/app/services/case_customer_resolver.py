from dataclasses import dataclass

from app.integrations.google_sheets import GoogleSheetsClient


CASE_SHEET = "پرونده‌ها"
CUSTOMER_SHEET = "مشتریان"


@dataclass(frozen=True)
class ResolveResult:
    scanned: int
    resolved: int
    unresolved: int
    ambiguous: int


class CaseCustomerResolver:
    """Populate immutable Customer ID from the existing customer registry.

    Matching is intentionally strict: normalized company title must map to exactly
    one active Customer ID. Ambiguous, inactive, or unknown names are never guessed.
    """

    def __init__(self, sheets: GoogleSheetsClient, spreadsheet_id: str):
        self.sheets = sheets
        self.spreadsheet_id = spreadsheet_id

    def resolve(self, dry_run: bool = True) -> ResolveResult:
        customers = self.sheets.read_values(self.spreadsheet_id, f"{CUSTOMER_SHEET}!A2:T1000")
        index: dict[str, set[str]] = {}
        for row in customers:
            if len(row) < 3 or not row[0] or not row[2]:
                continue
            active = row[19] if len(row) > 19 else True
            if not self._normalize_bool(active, default=True):
                continue
            index.setdefault(self._normalize(str(row[2])), set()).add(str(row[0]))

        cases = self.sheets.read_values(self.spreadsheet_id, f"{CASE_SHEET}!A2:AC1000")
        scanned = resolved = unresolved = ambiguous = 0
        updates: list[tuple[int, str]] = []

        for row_number, row in enumerate(cases, start=2):
            if not row or not self._cell(row, 0):
                continue
            scanned += 1
            existing_customer_id = self._cell(row, 28)
            if existing_customer_id:
                resolved += 1
                continue

            company_name = self._cell(row, 2)
            matches = index.get(self._normalize(str(company_name or "")), set())
            if len(matches) == 1:
                customer_id = next(iter(matches))
                updates.append((row_number, customer_id))
                resolved += 1
            elif len(matches) > 1:
                ambiguous += 1
            else:
                unresolved += 1

        if not dry_run:
            for row_number, customer_id in updates:
                self.sheets.update_values(
                    self.spreadsheet_id,
                    f"{CASE_SHEET}!AC{row_number}",
                    [[customer_id]],
                )

        return ResolveResult(scanned=scanned, resolved=resolved, unresolved=unresolved, ambiguous=ambiguous)

    @staticmethod
    def _cell(row: list[object], index: int) -> object | None:
        return row[index] if index < len(row) else None

    @staticmethod
    def _normalize(value: str) -> str:
        return " ".join(value.replace("ي", "ی").replace("ك", "ک").split()).casefold()

    @staticmethod
    def _normalize_bool(value: object, *, default: bool) -> bool:
        if value is None or value == "":
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0

        normalized = str(value).strip().casefold()
        truthy = {"true", "1", "yes", "y", "on", "بله", "فعال"}
        falsy = {"false", "0", "no", "n", "off", "خیر", "غیرفعال", "غيرفعال"}
        if normalized in truthy:
            return True
        if normalized in falsy:
            return False
        return default
