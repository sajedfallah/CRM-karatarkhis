from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]


class GoogleSheetsClient:
    def __init__(self, credentials_file: str):
        credentials = service_account.Credentials.from_service_account_file(credentials_file, scopes=SCOPES)
        self.service = build("sheets", "v4", credentials=credentials, cache_discovery=False)

    def read_values(self, spreadsheet_id: str, range_name: str) -> list[list[str]]:
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
