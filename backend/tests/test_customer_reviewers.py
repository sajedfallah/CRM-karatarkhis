import pytest
from sqlalchemy import select
from app.api.deps import get_current_user
from app.main import app
from app.models.auth import PasswordCredential
from app.models.core import Case, Customer, Document, Invitation, Organization, OrganizationMembership, Permission, Task, User
from app.services import invitations
from app.services.authentication import token_hash
from app.services.membership_identity import resolve_membership

PATH='/api/v1/customers/CUS-A/reviewer-invitations'
ORIGIN='https://crm.example.test'

@pytest.fixture()
def delivery(monkeypatch):
    from app.core.config import get_settings
    settings=get_settings();old=settings.auth_allowed_origins
    settings.auth_allowed_origins=[ORIGIN]
    sent=[]
    monkeypatch.setattr(invitations,'send_invitation_email',lambda row,token:sent.append((row.email,token)) or 'message-test')
    yield sent
    settings.auth_allowed_origins=old


def accept(client,token):
    return client.post('/api/v1/auth/accept-invitation',headers={'Origin':ORIGIN},json={'token':token,'password':'Long-reviewer-password-for-test','full_name':'Reviewer'})


def test_reviewer_invite_requires_admin_reason_and_email_and_keeps_token_private(client,db,actors,auth_headers,delivery):
    payload={'email':' Reviewer@Example.Test ','reason':'Authorized customer reviewer'}
    assert client.post(PATH,headers=auth_headers(actors['manager_a'].id),json=payload).status_code==403
    headers=auth_headers(actors['admin'].id)
    assert client.post(PATH,headers=headers,json={**payload,'reason':'  '}).status_code==422
    assert client.post(PATH,headers=headers,json={**payload,'email':'invalid'}).status_code==422
    response=client.post(PATH,headers=headers,json=payload)
    assert response.status_code==202,response.text
    assert delivery[0][0]=='reviewer@example.test' and delivery[0][1] not in response.text
    assert client.post(PATH,headers=headers,json=payload).json()['duplicate']
    assert len(delivery)==1
    row=db.scalar(select(Invitation))
    assert row.token_hash==token_hash(delivery[0][1])
    assert client.get(PATH,headers=headers).json()[0]['email']=='reviewer@example.test'
    assert client.get(PATH,headers=auth_headers(actors['manager_a'].id)).status_code==403


def test_activated_reviewer_has_no_generic_or_delegation_access(client,db,actors,auth_headers,delivery):
    headers=auth_headers(actors['admin'].id)
    assert client.post(PATH,headers=headers,json={'email':'reviewer@example.test','reason':'Authorized review'}).status_code==202
    assert accept(client,delivery[0][1]).status_code==200
    assert accept(client,delivery[0][1]).status_code==400
    user=db.scalar(select(User).where(User.email=='reviewer@example.test'))
    assert user.customer_id=='CUS-A' and db.get(PasswordCredential,user.id).email_verified_at
    identity=resolve_membership(db,user)
    assert identity.role=='customer_manager'
    permission=db.scalar(select(Permission).where(Permission.user_id==user.id))
    assert permission.scope_type=='DECLARATION_REVIEW' and not permission.can_view and not permission.can_assign
    db.add(Case(id='REVIEW-CASE',customer_id='CUS-A',operation_type='import',customs='Tehran'));db.commit()
    db.add_all([Task(id='INTERNAL-TASK',relation_type='case',customer_id='CUS-A',case_id='REVIEW-CASE',title='Internal',notes='private'),Document(id='INTERNAL-DOC',customer_id='CUS-A',case_id='REVIEW-CASE',document_type='other',title='Internal',drive_file_id='private-file',drive_url='https://example.test/private',notes='private')]);db.commit()
    app.dependency_overrides[get_current_user]=lambda:identity
    for resource in ['cases','tasks','documents']:
        assert client.get('/api/v1/'+resource).json()==[]
    assert client.get('/api/v1/declarations/cases').json()==[]
    assert client.post('/api/v1/documents/INTERNAL-DOC/approval',json={'approved':True}).status_code==403
    assert client.get('/api/v1/organizations/'+identity.organization_id+'/memberships').status_code==403
    assert client.post('/api/v1/organizations/'+identity.organization_id+'/memberships',json={'user_id':actors['manager_a'].id,'role':'customer_employee','permission_profile':'عملیاتی','reason':'Attempt escalation'}).status_code==403


def test_dedicated_reviewer_can_receive_and_decide_only_sent_declaration(client,db,actors,auth_headers,delivery,monkeypatch):
    from app.api.v1 import declarations
    objects={}
    class Store:
        def put(self,key,data,mime):objects[key]=data
        def get(self,key):return objects[key]
        def remove_uncommitted(self,key):objects.pop(key,None)
    monkeypatch.setattr(declarations,'PrivateFileStore',Store)
    headers=auth_headers(actors['admin'].id)
    client.post(PATH,headers=headers,json={'email':'reviewer@example.test','reason':'Authorized review'})
    assert accept(client,delivery[0][1]).status_code==200
    user=db.scalar(select(User).where(User.email=='reviewer@example.test'));identity=resolve_membership(db,user)
    db.add(Case(id='REVIEW-CASE',customer_id='CUS-A',operation_type='import',customs='Tehran'));db.commit()
    from uuid import uuid4
    response=client.post('/api/v1/declarations/cases/REVIEW-CASE',headers=headers,data={'upload_id':str(uuid4())},files={'file':('draft.pdf',b'%PDF-1.7 test','application/pdf')})
    assert response.status_code==201,response.text
    version=response.json()['id'];path='/api/v1/declarations/'+version
    assert client.post(path+'/send',headers=headers,json={'recipient_membership_id':identity.membership_id}).status_code==200
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.get('/api/v1/declarations/cases').json()[0]['id']=='REVIEW-CASE'
    assert client.get(path+'/file').status_code==200
    assert client.post(path+'/decision',json={'decision':'approved'}).status_code==200
    assert client.get('/api/v1/cases/REVIEW-CASE').status_code==404


def test_inactive_customer_blocks_activation_and_delivery_failure_revokes(client,db,actors,auth_headers,delivery,monkeypatch):
    from fastapi import HTTPException
    headers=auth_headers(actors['admin'].id)
    payload={'email':'reviewer@example.test','reason':'Authorized review'}
    client.post(PATH,headers=headers,json=payload)
    db.get(Customer,'CUS-A').is_active=False;db.commit()
    assert accept(client,delivery[0][1]).status_code==403
    assert db.scalar(select(User).where(User.email=='reviewer@example.test')) is None
    db.rollback();db.get(Customer,'CUS-A').is_active=True;db.commit()
    def fail(row,token):raise HTTPException(502,'email_delivery_failed')
    monkeypatch.setattr(invitations,'send_invitation_email',fail)
    assert client.post(PATH,headers=headers,json={**payload,'email':'another@example.test'}).status_code==502
    row=db.scalar(select(Invitation).where(Invitation.email=='another@example.test'))
    assert row.status=='delivery_failed' and row.revoked_at

