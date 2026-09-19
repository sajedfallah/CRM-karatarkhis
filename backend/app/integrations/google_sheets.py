import base64
import json

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class GoogleSheetsClient:
    def __init__(
        self,
        credentials_file: str | None = None,
        credentials_json: str | None = None,
        credentials_json_b64: str | None = None,
    ):
        credentials = self._build_credentials(
            credentials_file=credentials_file,
            credentials_json=credentials_json,
            credentials_json_b64=credentials_json_b64,
        )
        self.service = build("sheets", "v4", credentials=credentials, cache_discovery=False)

    @staticmethod
    def _build_credentials(
        *,
        credentials_file: str | None,
        credentials_json: str | None,
        credentials_json_b64: str | None,
    ):
        if credentials_json_b64:
            decoded = base64.b64decode(credentials_json_b64).decode("utf-8")
            info = json.loads(decoded)
            return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)

        if credentials_json:
            info = json.loads(credentials_json)
            return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)

        if credentials_file:
            return service_account.Credentials.from_service_account_file(credentials_file, scopes=SCOPES)

        raise ValueError(
            "Google credentials are not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON_B64, "
            "GOOGLE_SERVICE_ACCOUNT_JSON, or GOOGLE_SERVICE_ACCOUNT_FILE."
        )

    def read_values(self, spreadsheet_id: str, range_name: str) -> list[list[object]]:
        response = self.service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueRenderOption="UNFORMATTED_VALUE",
        ).execute()
        return response.get("values", [])

    def update_values(self, spreadsheet_id: str, range_name: str, values: list[list[object]]) -> None:
        self.service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption="RAW",
            body={"values": values},
        ).execute()

    def append_values(self, spreadsheet_id: str, range_name: str, values: list[list[object]]) -> None:
        self.service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption="RAW",
            insertDataOption="INSERT_ROWS",
            body={"values": values},
        ).execute()

    def clear_values(self, spreadsheet_id: str, range_name: str) -> None:
        self.service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            body={},
        ).execute()

    def find_row_by_first_column(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        record_id: str,
        *,
        start_row: int = 2,
        end_row: int = 5000,
    ) -> int | None:
        values = self.read_values(spreadsheet_id, f"'{sheet_name}'!A{start_row}:A{end_row}")
        for offset, row in enumerate(values):
            if row and str(row[0]).strip() == record_id:
                return start_row + offset
        return None

    def upsert_row_by_first_column(
        self,
        spreadsheet_id: str,
        sheet_name: str,
        record_id: str,
        row_values: list[object],
        *,
        end_column: str,
        start_row: int = 2,
    ) -> int:
        row_number = self.find_row_by_first_column(
            spreadsheet_id,
            sheet_name,
            record_id,
            start_row=start_row,
        )
        if row_number is None:
            existing = self.read_values(spreadsheet_id, f"'{sheet_name}'!A{start_row}:A5000")
            row_number = start_row + len(existing)
            while row_number > start_row and existing and existing[-1] == []:
                existing.pop()
                row_number -= 1
            self.update_values(
                spreadsheet_id,
                f"'{sheet_name}'!A{row_number}:{end_column}{row_number}",
                [row_values],
            )
        else:
            self.update_values(
                spreadsheet_id,
                f"'{sheet_name}'!A{row_number}:{end_column}{row_number}",
                [row_values],
            )
        return row_number
