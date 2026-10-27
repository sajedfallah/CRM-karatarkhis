from uuid import uuid4
from sqlalchemy import func,select
from app.models.core import AuditLog,Case
from app.models.compliance import CorporateDocument,CorporateDocumentVersion
from app.models.drafts import CaseDraft,DraftCorporateDocumentLink


def make_draft(client,headers):
    return client.post('/api/v1/case-drafts',headers=headers,json={
        'request_id':str(uuid4()),'customer_id':'CUS-A'}).json()


def add_document(db,actors,document_id,version_id,customer_id='CUS-A',number=1):
    db.add(CorporateDocument(id=document_id,customer_id=customer_id,title='Power of attorney',
        document_type='power_of_attorney',created_by=actors['admin'].id))
    db.flush()
    db.add(CorporateDocumentVersion(id=version_id,document_id=document_id,version=number,
        object_key='private/'+version_id,file_name=f'{version_id}.pdf',mime_type='application/pdf',
        size_bytes=10,sha256='a'*64,starts_on=None,expires_on=None,remind_days=30,
        created_by=actors['admin'].id))
    db.commit()


def test_exact_version_link_is_scoped_versioned_audited_and_detachable(client,db,actors,auth_headers):
    admin=auth_headers(actors['admin'].id);draft=make_draft(client,admin)
    add_document(db,actors,'DOC-A','DOC-A-V1')
    path=f"/api/v1/case-drafts/{draft['id']}/documents"
    initial=client.get(path,headers=admin)
    assert initial.status_code==200
    assert initial.json()['draft_version']==1
    assert [item['document_version_id'] for item in initial.json()['available']]==['DOC-A-V1']
    attach={'expected_version':1,'document_version_id':'DOC-A-V1'}
    linked=client.post(path,headers=admin,json=attach)
    assert linked.status_code==201,linked.text
    assert linked.json()['draft_version']==2
    assert linked.json()['linked'][0]['document_version_id']=='DOC-A-V1'
    assert 'object_key' not in linked.text and 'sha256' not in linked.text
    replay=client.post(path,headers=admin,json=attach)
    assert replay.status_code==201 and replay.json()['draft_version']==2
    assert client.post(path,headers=admin,json={'expected_version':2,'document_version_id':'DOC-A-V1'}).json()['draft_version']==2
    check=client.get(f"/api/v1/case-drafts/{draft['id']}/readiness?expected_version=2",headers=admin).json()
    assert check['corporate_documents_are_linked']
    assert check['linked_corporate_documents'][0]['document_version_id']=='DOC-A-V1'
    link_id=linked.json()['linked'][0]['link_id']
    detached=client.post(f'{path}/{link_id}/detach',headers=admin,json={'expected_version':2})
    assert detached.status_code==200 and detached.json()['draft_version']==3
    assert detached.json()['linked']==[]
    assert db.get(DraftCorporateDocumentLink,link_id).removed_at is not None
    assert db.get(CaseDraft,draft['id']).content==draft['content']
    assert db.get(CaseDraft,draft['id']).version==3
    assert db.scalar(select(func.count()).select_from(Case))==0
    assert {item.action for item in db.scalars(select(AuditLog).where(
        AuditLog.entity_type=='draft_corporate_document_link'))}=={'attach_exact_version','detach_exact_version'}


def test_link_rejects_cross_customer_versions_roles_and_stale_mutation(client,db,actors,auth_headers):
    admin=auth_headers(actors['admin'].id);draft=make_draft(client,admin)
    add_document(db,actors,'DOC-B','DOC-B-V1',customer_id='CUS-B')
    path=f"/api/v1/case-drafts/{draft['id']}/documents"
    assert client.post(path,headers=admin,json={'expected_version':1,'document_version_id':'DOC-B-V1'}).status_code==404
    assert client.get(path,headers=auth_headers(actors['manager_a'].id)).status_code==403
    assert client.post(path,headers=auth_headers(actors['manager_a'].id),json={
        'expected_version':1,'document_version_id':'DOC-B-V1'}).status_code==403
    assert client.post(path,headers=admin,json={'expected_version':0,'document_version_id':'DOC-B-V1'}).status_code==422
    assert db.scalar(select(func.count()).select_from(DraftCorporateDocumentLink))==0

