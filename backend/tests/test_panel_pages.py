from fastapi.testclient import TestClient

from app.api import auth_pages
from app.main import app


def test_panel_requires_a_real_build(monkeypatch, tmp_path):
    monkeypatch.setattr(auth_pages, "ROOT", tmp_path)
    with TestClient(app) as client:
        assert client.get("/app").status_code == 503


def test_panel_routes_assets_and_security_headers(monkeypatch, tmp_path):
    panel = tmp_path / "panel"
    (panel / "assets").mkdir(parents=True)
    (panel / "index.html").write_text("<html>panel</html>")
    (panel / "assets" / "main.js").write_text("export {}")
    (panel / "private.txt").write_text("private")
    monkeypatch.setattr(auth_pages, "ROOT", tmp_path)
    with TestClient(app) as client:
        response = client.get("/app/cases")
        assert response.status_code == 200
        assert response.headers["cache-control"] == "no-store"
        assert "font-src 'self'" in response.headers["content-security-policy"]
        asset = client.get("/app/assets/main.js")
        assert asset.status_code == 200
        assert "immutable" in asset.headers["cache-control"]
        assert client.get("/app/private.txt").status_code == 404
        assert client.get("/app/assets/%2e%2e%2fprivate.txt").status_code == 404
        assert client.get("/app/assets/missing.js").status_code == 404
