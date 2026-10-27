from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse

router = APIRouter(include_in_schema=False)
ROOT = Path(__file__).resolve().parents[1] / "web"
HEADERS = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
}


@router.get("/")
def root():
    return RedirectResponse("/login", status_code=303)


@router.get("/activate")
@router.get("/login")
@router.get("/account")
def auth_page():
    return FileResponse(ROOT / "auth.html", headers=HEADERS)


@router.get("/auth-assets/{name}")
def auth_asset(name: str):
    if name not in {"auth.js", "auth.css"}:
        raise HTTPException(404)
    return FileResponse(ROOT / name, headers=HEADERS)
