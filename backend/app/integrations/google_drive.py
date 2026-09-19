import base64
import json

from google.oauth2 import service_account
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/drive"]
_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder"


class GoogleDriveClient:
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
        self.service = build("drive", "v3", credentials=credentials, cache_discovery=False)

    @staticmethod
    def _build_credentials(
        *,
        credentials_file: str | None,
        credentials_json: str | None,
        credentials_json_b64: str | None,
    ):
        if credentials_json_b64:
            info = json.loads(base64.b64decode(credentials_json_b64).decode("utf-8"))
            return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        if credentials_json:
            return service_account.Credentials.from_service_account_info(json.loads(credentials_json), scopes=SCOPES)
        if credentials_file:
            return service_account.Credentials.from_service_account_file(credentials_file, scopes=SCOPES)
        raise ValueError("Google Drive credentials are not configured")

    @staticmethod
    def _escape_query(value: str) -> str:
        return value.replace("\\", "\\\\").replace("'", "\\'")

    def find_folder(self, *, parent_id: str, name: str) -> str | None:
        escaped_parent = self._escape_query(parent_id)
        escaped_name = self._escape_query(name)
        response = self.service.files().list(
            q=(
                f"'{escaped_parent}' in parents and "
                f"name = '{escaped_name}' and "
                f"mimeType = '{_FOLDER_MIME_TYPE}' and trashed = false"
            ),
            spaces="drive",
            fields="files(id,name)",
            pageSize=10,
        ).execute()
        files = response.get("files", [])
        return files[0]["id"] if files else None

    def ensure_folder(self, *, parent_id: str, name: str) -> str:
        existing = self.find_folder(parent_id=parent_id, name=name)
        if existing:
            return existing
        created = self.service.files().create(
            body={"name": name, "mimeType": _FOLDER_MIME_TYPE, "parents": [parent_id]},
            fields="id",
        ).execute()
        return created["id"]
