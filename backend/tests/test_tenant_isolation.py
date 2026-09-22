def _create_case(client, headers, customer_id, number):
    response = client.post("/api/v1/cases", headers=headers, json={"customer_id": customer_id, "real_case_number": number, "operation_type": "import", "customs": "Tehran"})
    assert response.status_code == 201, response.text
    return response.json()


def test_customer_cannot_read_another_customers_case(client, actors, auth_headers):
    case = _create_case(client, auth_headers(actors["admin"].id), "CUS-A", "A-001")
    response = client.get(f"/api/v1/cases/{case['id']}", headers=auth_headers(actors["manager_b"].id))
    assert response.status_code == 404
    listed = client.get("/api/v1/cases", headers=auth_headers(actors["manager_b"].id))
    assert listed.status_code == 200
    assert listed.json() == []


def test_customer_cannot_create_case_for_another_customer(client, actors, auth_headers):
    response = client.post("/api/v1/cases", headers=auth_headers(actors["manager_a"].id), json={"customer_id": "CUS-B", "operation_type": "import", "customs": "Tehran"})
    assert response.status_code == 403


def test_case_task_and_document_regression(client, actors, auth_headers):
    admin_headers = auth_headers(actors["admin"].id)
    case = _create_case(client, admin_headers, "CUS-A", "A-002")
    task = client.post("/api/v1/tasks", headers=admin_headers, json={"relation_type": "case", "case_id": case["id"], "title": "Review declaration"})
    assert task.status_code == 201, task.text
    document = client.post("/api/v1/documents", headers=admin_headers, json={"customer_id": "CUS-A", "case_id": case["id"], "document_type": "invoice", "title": "Invoice", "drive_file_id": "file-a-002", "drive_url": "https://drive.example/file-a-002"})
    assert document.status_code == 201, document.text
    assert client.get(f"/api/v1/tasks/{task.json()['id']}", headers=auth_headers(actors["manager_b"].id)).status_code == 404
    assert client.get(f"/api/v1/documents/{document.json()['id']}", headers=auth_headers(actors["manager_b"].id)).status_code == 404
