from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Karatarkhis CRM API"
    app_env: str = "development"
    app_version: str = "5.0.0-dev"
    database_url: str
    log_level: str = "INFO"

    google_spreadsheet_id: str | None = None
    google_service_account_file: str | None = None
    google_service_account_json: str | None = None
    google_service_account_json_b64: str | None = None
    google_customer_docs_root_folder_id: str | None = None
    google_case_import_root_folder_id: str | None = None
    google_case_export_root_folder_id: str | None = None

    telegram_bot_token: str | None = None
    telegram_webhook_secret: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
