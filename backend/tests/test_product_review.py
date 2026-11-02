from uuid import uuid4
from sqlalchemy import select,func
from app.models.drafts import CaseDraft
from app.models.product_review import DraftProductReview
from app.models.core import Case


def create(client,headers):
    return client.post('/api/v1/case-drafts',headers=headers,json={'request_id':str(uuid4()),'customer_id':'CUS-A'}).json()


def content():
    return {'product_description':'Technical goods','operation_type':'import','customs':'Example',
        'product_details':{'technical_attributes':'Capacity and specification','hs_code':'123456','brand':'Example'}}


def test_human_review_is_version_bound_immutable_and_invalidated_even_on_revert(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);draft=create(client,headers);path='/api/v1/case-drafts/'+draft['id']
    saved=client.put(path,headers=headers,json={'expected_version':1,'content':content()})
    assert saved.status_code==200,saved.text
    assert saved.json()['product_review']['status']=='NEEDS_REVIEW'
    payload={'expected_version':2,'reason':'Verified against the technical datasheet'}
    review=client.post(path+'/product-review',headers=headers,json=payload)
    assert review.status_code==200,review.text
    assert review.json()['product_review']['status']=='VERIFIED'
    review_id=review.json()['product_review']['id']
    assert client.post(path+'/product-review',headers=headers,json=payload).json()['product_review']['id']==review_id
    assert db.scalar(select(func.count()).select_from(DraftProductReview))==1
    initial=db.get(DraftProductReview,review_id).snapshot
    # A title edit does not change the classification source.
    unchanged={**content(),'title':'New case title'}
    assert client.put(path,headers=headers,json={'expected_version':2,'content':unchanged}).json()['product_review']['status']=='VERIFIED'
    changed={**unchanged,'product_details':{**content()['product_details'],'brand':'Changed'}}
    assert client.put(path,headers=headers,json={'expected_version':3,'content':changed}).json()['product_review']['status']=='NEEDS_REVIEW'
    assert client.put(path,headers=headers,json={'expected_version':4,'content':unchanged}).json()['product_review']['status']=='NEEDS_REVIEW'
    assert db.get(DraftProductReview,review_id).snapshot==initial
    assert client.post(path+'/product-review',headers=headers,json=payload).status_code==409
    fresh=client.post(path+'/product-review',headers=headers,json={**payload,'expected_version':5})
    assert fresh.json()['product_review']['status']=='VERIFIED'
    assert db.scalar(select(func.count()).select_from(DraftProductReview))==2
    assert db.scalar(select(func.count()).select_from(Case))==0


def test_review_requires_admin_complete_source_and_explicit_reason(client,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);draft=create(client,headers);path='/api/v1/case-drafts/'+draft['id']
    payload={'expected_version':1,'reason':'Human verification'}
    assert client.post(path+'/product-review',headers=auth_headers(actors['manager_a'].id),json=payload).status_code==403
    assert client.post(path+'/product-review',headers=headers,json=payload).status_code==422
    assert client.post(path+'/product-review',headers=headers,json={**payload,'reason':' '}).status_code==422
    assert client.post(path+'/product-review',headers=headers,json={**payload,'reviewed_by':actors['admin'].id}).status_code==422
    assert client.put(path,headers=headers,json={'expected_version':1,'content':{'product_details':{'hs_code':'12abc6'}}}).status_code==422
    assert client.put(path,headers=headers,json={'expected_version':1,'content':{'product_details':{'hs_code':'12345'}}}).status_code==422
    assert client.put(path,headers=headers,json={'expected_version':1,'content':{'product_details':{'verified':True}}}).status_code==422


def test_legacy_draft_read_adds_defaults_without_mutation(client,db,actors,auth_headers):
    headers=auth_headers(actors['admin'].id);draft=create(client,headers)
    row=db.get(CaseDraft,draft['id']);row.content={'title':'Legacy','product_description':'Old description'};db.commit()
    response=client.get('/api/v1/case-drafts/'+row.id,headers=headers)
    assert response.json()['content']['product_details']['hs_code']==''
    assert response.json()['version']==1
    assert row.content=={'title':'Legacy','product_description':'Old description'}

