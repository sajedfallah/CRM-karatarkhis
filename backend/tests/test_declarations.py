from uuid import uuid4
import pytest
from fastapi import HTTPException
from sqlalchemy import select
from app.api.deps import get_current_user
from app.api.v1 import declarations
from app.main import app
from app.models.core import Case, CaseAccessGrant, Organization, OrganizationMembership, Permission
from app.models.auth import PasswordCredential
from app.models.declarations import DeclarationVersion, DeclarationRequest, DeclarationDecision
from app.services.authentication import utc_now
from app.services.membership_identity import resolve_membership

PDF=b"%PDF-1.7\nTest declaration\n%%EOF"

@pytest.fixture()
def setup_review(db,actors,monkeypatch):
    case=Case(id="IMPORT-A",customer_id="CUS-A",operation_type="import",customs="Tehran")
    other=Case(id="IMPORT-B",customer_id="CUS-B",operation_type="import",customs="Tehran")
    org=Organization(id="DECL-ORG",type="CUSTOMER",customer_id="CUS-A",name="Customer",slug="decl-org")
    db.add_all([case,other,org]);db.flush()
    member=OrganizationMembership(id="DECL-MEM",organization_id=org.id,user_id=actors["manager_a"].id,
        role="customer_manager",permission_profile="عملیاتی",scope_type="ORGANIZATION",status="ACTIVE")
    actors["manager_a"].email="customer@example.test"
    db.add_all([member,PasswordCredential(user_id=actors["manager_a"].id,password_hash="unused",verified_email="customer@example.test",email_verified_at=utc_now())])
    db.scalar(select(Permission).where(Permission.user_id==actors["manager_a"].id)).can_approve_documents=True
    db.commit()
    objects={}
    class Store:
        def put(self,key,data,mime):
            assert not db.in_transaction()
            objects[key]=data
        def get(self,key):
            assert not db.in_transaction()
            return objects[key]
        def remove_uncommitted(self,key): objects.pop(key,None)
    monkeypatch.setattr(declarations,"PrivateFileStore",Store)
    return case,member,objects


def upload(client,headers,upload_id=None,case="IMPORT-A",data=PDF):
    return client.post('/api/v1/declarations/cases/'+case,headers=headers,data={"upload_id":upload_id or str(uuid4())},files={"file":("declaration.pdf",data,"application/pdf")})


def test_upload_versions_private_download_replay_and_tenant_boundary(client,db,actors,auth_headers,setup_review):
    _,_,objects=setup_review
    admin=auth_headers(actors["admin"].id)
    uid=str(uuid4());first=upload(client,admin,uid)
    assert first.status_code==201,first.text
    version=first.json()
    assert version['status']=='uploaded' and version['version']==1
    assert 'object_key' not in first.text and 'sha256' not in first.text
    assert upload(client,admin,uid).json()['id']==version['id']
    assert len(objects)==1
    assert upload(client,admin,uid,data=PDF+b'changed').status_code==409
    assert upload(client,auth_headers(actors['manager_a'].id)).status_code==403
    assert client.get('/api/v1/declarations/'+version['id']+'/file',headers=auth_headers(actors['manager_b'].id)).status_code==404
    file=client.get('/api/v1/declarations/'+version['id']+'/file',headers=admin)
    assert file.content==PDF and 'no-store' in file.headers['cache-control']
    assert upload(client,admin).json()['version']==2
    assert db.get(DeclarationVersion,version['id']).sha256


def test_customer_review_correction_resubmit_and_admin_cannot_approve(client,db,actors,auth_headers,setup_review):
    case,member,_=setup_review
    admin=auth_headers(actors['admin'].id)
    first=upload(client,admin).json();path='/api/v1/declarations/'+first['id']
    assert client.post(path+'/decision',headers=admin,json={'decision':'approved'}).status_code==403
    send=client.post(path+'/send',headers=admin,json={'recipient_membership_id':member.id})
    assert send.status_code==200,send.text
    assert client.post(path+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==200
    assert len(list(db.scalars(select(DeclarationRequest))))==1
    identity=resolve_membership(db,actors['manager_a'])
    app.dependency_overrides[get_current_user]=lambda:identity
    assert len(client.get('/api/v1/declarations/inbox').json())==1
    assert client.post(path+'/decision',json={'decision':'correction_required','comment':'  '}).status_code==422
    payload={'decision':'correction_required','comment':'Correct quantity'}
    assert client.post(path+'/decision',json=payload).json()['status']=='correction_required'
    assert client.post(path+'/decision',json=payload).status_code==200
    assert client.post(path+'/decision',json={'decision':'approved'}).status_code==409
    assert len(list(db.scalars(select(DeclarationDecision))))==1
    assert client.get('/api/v1/declarations/inbox').json()==[]
    del app.dependency_overrides[get_current_user]
    second=upload(client,admin).json();path2='/api/v1/declarations/'+second['id']
    assert second['status']=='uploaded'
    assert client.post(path2+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==200
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.post(path+'/decision',json=payload).status_code==409
    assert client.post(path2+'/decision',json={'decision':'approved'}).json()['status']=='approved'
    assert client.get('/api/v1/declarations/inbox').json()==[]


def test_unsent_file_hidden_reviewer_revoked_and_new_version_invalidates_pending(client,db,actors,auth_headers,setup_review):
    _,member,_=setup_review
    admin=auth_headers(actors['admin'].id)
    first=upload(client,admin).json();path='/api/v1/declarations/'+first['id']
    identity=resolve_membership(db,actors['manager_a'])
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.get(path+'/file').status_code==404
    assert client.get('/api/v1/declarations/cases/IMPORT-A').json()==[]
    del app.dependency_overrides[get_current_user]
    client.post(path+'/send',headers=admin,json={'recipient_membership_id':member.id})
    second=upload(client,admin).json()
    app.dependency_overrides[get_current_user]=lambda:identity
    assert client.post(path+'/decision',json={'decision':'approved'}).status_code==409
    assert client.get('/api/v1/declarations/inbox').json()==[]
    assert client.get('/api/v1/declarations/'+second['id']+'/file').status_code==404
    member.status='INACTIVE';db.commit()
    assert client.get(path+'/file').status_code==403


def test_send_denies_missing_recipient_foreign_case_and_unverified_user(client,db,actors,auth_headers,setup_review):
    _,member,_=setup_review
    admin=auth_headers(actors['admin'].id)
    version=upload(client,admin,case='IMPORT-B').json()
    assert client.post('/api/v1/declarations/'+version['id']+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==403
    version=upload(client,admin).json()
    db.get(PasswordCredential,actors['manager_a'].id).email_verified_at=None;db.commit()
    assert client.post('/api/v1/declarations/'+version['id']+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==409
    assert list(db.scalars(select(DeclarationRequest)))==[]


def test_selected_case_review_grant_revocation_and_integrity(client,db,actors,auth_headers,setup_review):
    case,member,objects=setup_review
    admin=auth_headers(actors['admin'].id)
    version=upload(client,admin).json();path='/api/v1/declarations/'+version['id']
    member.scope_type='SELECTED_CASES';db.commit()
    assert client.get('/api/v1/declarations/cases/IMPORT-A/reviewers',headers=admin).json()==[]
    grant=CaseAccessGrant(id='DECL-GRANT',membership_id=member.id,case_id=case.id,access_level='view')
    db.add(grant);db.commit()
    assert client.post(path+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==403
    grant.access_level='edit';db.commit()
    assert client.post(path+'/send',headers=admin,json={'recipient_membership_id':member.id}).status_code==200
    identity=resolve_membership(db,actors['manager_a'])
    app.dependency_overrides[get_current_user]=lambda:identity
    objects[db.get(DeclarationVersion,version['id']).object_key]=PDF+b'tampered'
    assert client.get(path+'/file').status_code==503
    grant.revoked_at=utc_now();db.commit()
    assert client.post(path+'/decision',json={'decision':'approved'}).status_code==404
    assert client.get('/api/v1/declarations/inbox').json()==[]
