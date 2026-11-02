from uuid import uuid4

from sqlalchemy import select

from app.models.core import AuditLog
from app.models.case_registration_request import CaseRegistrationRequest


def test_export_packing_precedes_submission_and_is_invalidated_by_edit(client, db, actors, auth_headers):
    headers = auth_headers(actors['manager_a'].id)
    details = dict(border_code='101', buyer_name='Buyer', destination_country='Turkey',
        transport_type='road', vehicle_capacity='20t', driver_name='Driver', driver_mobile='09120000000',
        driver_national_code='1234567890', vehicle_plate='TEST', products=[dict(name='Product',
        hs_code='12345678', quantity='10', unit='kg', package_type='box', package_count=2,
        net_weight='10', gross_weight='12', value='100', currency='USD')])
    payload = dict(title='Export test', operation_type='export', customs='Test', hs_code='', details=details)
    created = client.post('/api/v1/case-registration-requests', headers=headers,
        json={**payload, 'request_id': str(uuid4())})
    assert created.status_code == 201, created.text
    request_id = created.json()['id']
    path = '/api/v1/case-registration-requests/' + request_id
    row = db.get(CaseRegistrationRequest, request_id)
    row.documents = [dict(id='DOC-TEST', document_type='supporting_document', title='test',
        file_name='test.pdf', mime_type='application/pdf', size_bytes=10, uploaded_at='2026-11-02T00:00:00Z')]
    db.commit()
    assert client.post(path+'/submit', headers=headers).json()['detail'] == 'export_packing_list_required_before_submission'
    other = auth_headers(actors['manager_b'].id)
    assert client.post(path+'/packing-list', headers=other).status_code == 404
    generated = client.post(path+'/packing-list', headers=headers)
    assert generated.status_code == 200, generated.text
    assert generated.json()['packing_list_ready'] is True
    assert '_packing_list_snapshot' not in generated.json()['details']
    assert client.post(path+'/packing-list', headers=headers).status_code == 200
    events = list(db.scalars(select(AuditLog).where(AuditLog.entity_id == request_id,
        AuditLog.action == 'generate_initial_export_packing_list')))
    assert len(events) == 1
    changed = client.put(path, headers=headers, json={**payload, 'title':'Changed export'})
    assert changed.status_code == 200, changed.text
    assert changed.json()['packing_list_ready'] is False
    assert client.post(path+'/submit', headers=headers).status_code == 422
    assert client.post(path+'/packing-list', headers=headers).status_code == 200
    assert client.post(path+'/submit', headers=headers).status_code == 200
    assert client.post(path+'/packing-list', headers=headers).status_code == 409

