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
