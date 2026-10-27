import {afterEach,expect,test,vi} from 'vitest';
import {saveDraft,draftValidation,type DraftContent,emptyProductDetails} from './drafts';
const content:DraftContent={title:'Draft',operation_type:null,customs:'',product_description:'',shipment_reference:'',quantity:null,net_weight:null,gross_weight:null};
afterEach(()=>vi.unstubAllGlobals());
test('draft save carries expected version and csrf without using the final case API',async()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=> 'test-csrf'});
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:'DRAFT-1',version:3}),{status:200}));vi.stubGlobal('fetch',fetch);
  await saveDraft('DRAFT-1',2,content);
  expect(fetch).toHaveBeenCalledWith('/api/v1/case-drafts/DRAFT-1',expect.objectContaining({method:'PUT',body:JSON.stringify({expected_version:2,content}),headers:expect.objectContaining({'X-CSRF-Token':'test-csrf'})}));
});
test('partial drafts are allowed and weight/quantity inconsistencies block autosave',()=>{
  expect(draftValidation(content)).toBe('');
  expect(draftValidation({...content,net_weight:'12',gross_weight:'11'})).not.toBe('');
  expect(draftValidation({...content,net_weight:'-1'})).not.toBe('');
  expect(draftValidation({...content,quantity:0})).not.toBe('');
  expect(draftValidation({...content,quantity:1.5})).not.toBe('');
});

test('technical product input accepts a partial draft but rejects malformed HS values',()=>{
  expect(draftValidation({...content,product_details:{...emptyProductDetails,technical_attributes:'Specification'}})).toBe('');
  expect(draftValidation({...content,product_details:{...emptyProductDetails,hs_code:'123456'}})).toBe('');
  expect(draftValidation({...content,product_details:{...emptyProductDetails,hs_code:'ABC123'}})).not.toBe('');
});

