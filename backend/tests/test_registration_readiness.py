from datetime import timedelta
from uuid import uuid4
from sqlalchemy import func,select
from app.models.core import AuditLog,Case
from app.models.drafts import CaseDraft
from app.models.compliance import CorporateDocument,CorporateDocumentVersion,DocumentNotification
from app.services.document_expiry import local_today


def draft(client,headers):
    return client.post('/api/v1/case-drafts',headers=headers,json={'request_id':str(uuid4()),'customer_id':'CUS-A'}).json()


def test_readiness_is_read_only_and_never_enables_final_submission(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);row=draft(client,headers)
    audits=db.scalar(select(func.count()).select_from(AuditLog))
    path='/api/v1/case-drafts/'+row['id']
    response=client.get(path+'/readiness?expected_version=1',headers=headers)
    assert response.status_code==200,response.text
    data=response.json()
    assert not data['initial_data_complete'] and not data['final_submission_available']
    assert not data['finance_estimate']['complete'] and data['finance_estimate']['amount'] is None
    assert next(c for c in data['initial_checks'] if c['id']=='customer')['complete']
    assert not next(c for c in data['initial_checks'] if c['id']=='quantity')['complete']
    assert {g['requirement'] for g in data['workflow_gaps']} >= {'SUB-001','SUB-002','PRD-HS','DOC-CORE'}
    content={'title':'Complete initial information','operation_type':'import','customs':'Tehran','product_description':'Goods','shipment_reference':'BL-TEST','quantity':1,'net_weight':'0','gross_weight':'1'}
    assert client.put(path,headers=headers,json={'expected_version':1,'content':content}).status_code==200
    assert client.get(path+'/readiness?expected_version=1',headers=headers).status_code==409
    data=client.get(path+'/readiness?expected_version=2',headers=headers).json()
    assert data['initial_data_complete'] and not data['final_submission_available']
    assert not data['finance_estimate']['complete']
    assert db.get(CaseDraft,row['id']).version==2
    assert db.scalar(select(func.count()).select_from(Case))==0
    assert db.scalar(select(func.count()).select_from(DocumentNotification))==0
    assert db.scalar(select(func.count()).select_from(AuditLog))==audits+1
    assert 'no-store' in response.headers['cache-control']


def test_readiness_reports_internal_draft_estimate_without_financial_posting(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);row=draft(client,headers)
    path='/api/v1/case-drafts/'+row['id']
    content={'finance_estimate':{'description':'Internal estimate','amount':'987.50','currency':'USD'}}
    saved=client.put(path,headers=headers,json={'expected_version':1,'content':content})
    assert saved.status_code==200,saved.text
    readiness=client.get(path+'/readiness?expected_version=2',headers=headers).json()
    assert readiness['finance_estimate']=={'complete':True,'description':'Internal estimate','amount':'987.50','currency':'USD'}
    assert not readiness['final_submission_available']
    assert db.scalar(select(func.count()).select_from(Case))==0


def test_readiness_admin_only_and_strict_version_validation(client,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);row=draft(client,headers)
    path='/api/v1/case-drafts/'+row['id']+'/readiness'
    assert client.get(path+'?expected_version=1',headers=auth_headers(actors['manager_a'].id)).status_code==403
    assert client.get(path+'?expected_version=0',headers=headers).status_code==422
    assert client.get(path,headers=headers).status_code==422
    assert client.get('/api/v1/case-drafts/MISSING/readiness?expected_version=1',headers=headers).status_code==404


def test_export_shipment_readiness_lists_canonical_fields_without_claiming_submission(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);row=draft(client,headers)
    path='/api/v1/case-drafts/'+row['id']
    content={'operation_type':'export','customs':'Bandar Abbas','product_description':'Goods','quantity':4,
        'net_weight':'10','gross_weight':'12','product_details':{'hs_code':'123456'},
        'export_shipment':{'package_type':'Carton','package_count':2,'total_value':'500.00','currency':'USD',
            'driver_mobile':'09120000000','vehicle_identifier':'Truck 1'}}
    saved=client.put(path,headers=headers,json={'expected_version':1,'content':content})
    assert saved.status_code==200,saved.text
    data=client.get(path+'/readiness?expected_version=2',headers=headers).json()
    assert data['shipment_check_status']=='INCOMPLETE'
    checks={item['id']:item['complete'] for item in data['shipment_checks']}
    assert checks=={'package_type':True,'package_count':True,'total_value':True,'currency':True,
        'customs':True,'hs_code':True,'driver_mobile':True,'vehicle_identifier':True,'hs_human_review':False}
    assert not data['final_submission_available']
    assert client.get(path+'/readiness?expected_version=1',headers=headers).status_code==409
    assert db.scalar(select(func.count()).select_from(Case))==0


def test_only_latest_own_customer_document_validity_is_informational(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);row=draft(client,headers)
    for name,customer in [('OWN','CUS-A'),('OTHER','CUS-B')]:
        db.add(CorporateDocument(id=name,customer_id=customer,title=name,document_type='license',created_by=actors['admin'].id))
    db.flush()
    for document,number,expiry in [('OWN',1,local_today()-timedelta(days=1)),('OWN',2,local_today()+timedelta(days=100)),('OTHER',1,local_today()+timedelta(days=200))]:
        db.add(CorporateDocumentVersion(id=f'{document}-{number}',document_id=document,version=number,object_key=f'test/{document}/{number}',file_name='file.pdf',mime_type='application/pdf',size_bytes=10,sha256='a'*64,expires_on=expiry,created_by=actors['admin'].id))
    db.commit()
    data=client.get('/api/v1/case-drafts/'+row['id']+'/readiness?expected_version=1',headers=headers).json()
    assert [(d['id'],d['version'],d['status']) for d in data['corporate_documents']]==[('OWN',2,'VALID')]
    assert not data['corporate_documents_are_linked'] and not data['final_submission_available']
    assert 'object_key' not in str(data) and 'sha256' not in str(data)

