from fastapi import FastAPI, HTTPException
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import engine
from app.integrations.google_sheets import GoogleSheetsClient

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url=None,
)
app.include_router(api_router)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"], include_in_schema=False)
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@app.get("/health/db", tags=["system"])
@app.get("/api/health/db", tags=["system"], include_in_schema=False)
def database_health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok", "database": "reachable"}


@app.get("/health/sheets", tags=["system"])
@app.get("/api/health/sheets", tags=["system"], include_in_schema=False)
def sheets_health() -> dict[str, str]:
    if not settings.google_spreadsheet_id:
        raise HTTPException(status_code=503, detail="google_spreadsheet_not_configured")

    if not any(
        [
            settings.google_service_account_json_b64,
            settings.google_service_account_json,
            settings.google_service_account_file,
        ]
    ):
        raise HTTPException(status_code=503, detail="google_credentials_not_configured")

    try:
        client = GoogleSheetsClient(
            credentials_file=settings.google_service_account_file,
            credentials_json=settings.google_service_account_json,
            credentials_json_b64=settings.google_service_account_json_b64,
        )
        client.read_values(settings.google_spreadsheet_id, "'داشبورد مدیریتی'!A1:A1")
    except Exception as exc:
        raise HTTPException(status_code=503, detail="google_sheets_unreachable") from exc

    return {"status": "ok", "google_sheets": "reachable"}
