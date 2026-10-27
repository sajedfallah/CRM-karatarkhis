import {request,prepareWriteSession} from './api';
export type DraftContent={title:string;operation_type:'import'|'export'|'transit'|null;customs:string;product_description:string;shipment_reference:string;quantity:number|null;net_weight:string|null;gross_weight:string|null};
export type CaseDraft={id:string;customer_id:string;customer_name:string;version:number;content:DraftContent;status:'DRAFT';created_at:string;updated_at:string};
export async function createDraft(customerId:string,requestId:string){return request<CaseDraft>('case-drafts',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({customer_id:customerId,request_id:requestId})});}
export async function saveDraft(id:string,expectedVersion:number,content:DraftContent){return request<CaseDraft>('case-drafts/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:expectedVersion,content})});}
export function draftValidation(content:DraftContent):string{
  if(content.quantity!==null&&(!Number.isInteger(content.quantity)||content.quantity<1||content.quantity>1_000_000_000))return 'تعداد باید عدد صحیح مثبت باشد.';
  for(const weight of [content.net_weight,content.gross_weight])if(weight!==null&&(!Number.isFinite(Number(weight))||Number(weight)<0))return 'وزن باید عدد نامنفی باشد.';
  if(content.net_weight!==null&&content.gross_weight!==null&&Number(content.gross_weight)<Number(content.net_weight))return 'وزن ناخالص نمی‌تواند کمتر از وزن خالص باشد.';
  return '';
}
