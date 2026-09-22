def test_health_is_available_without_identity(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_protected_endpoint_requires_identity(client):
    response = client.get("/api/v1/cases")
    assert response.status_code == 401
    assert response.json()["detail"] == "missing_identity"
