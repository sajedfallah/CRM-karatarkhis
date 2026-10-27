import {request,prepareWriteSession} from './api';
export type ProductDetails={brand:string;model:string;material:string;intended_use:string;technical_attributes:string;country_of_origin:string;hs_code:string};
export const emptyProductDetails:ProductDetails={brand:'',model:'',material:'',intended_use:'',technical_attributes:'',country_of_origin:'',hs_code:''};
export type ExportShipmentDetails={package_type:string;package_count:number|null;total_value:string|null;currency:string;driver_mobile:string;vehicle_identifier:string};
export const emptyExportShipment:ExportShipmentDetails={package_type:'',package_count:null,total_value:null,currency:'',driver_mobile:'',vehicle_identifier:''};
export type DraftContent={title:string;operation_type:'import'|'export'|'transit'|null;customs:string;product_description:string;shipment_reference:string;product_details?:ProductDetails;export_shipment?:ExportShipmentDetails;quantity:number|null;net_weight:string|null;gross_weight:string|null};
export type CaseDraft={id:string;customer_id:string;customer_name:string;version:number;content:DraftContent;status:'DRAFT';product_review?:{status:'VERIFIED'|'NEEDS_REVIEW';product_revision:number;reason?:string};created_at:string;updated_at:string};
export type DraftDocument={link_id?:string;document_id:string;document_version_id:string;title:string;document_type:string;version:number;file_name:string;starts_on:string|null;expires_on:string|null;status:string;added_at?:string};
export type DraftDocumentState={draft_id:string;draft_version:number;linked:DraftDocument[];available:DraftDocument[]};
export async function createDraft(customerId:string,requestId:string){return request<CaseDraft>('case-drafts',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({customer_id:customerId,request_id:requestId})});}
export async function saveDraft(id:string,expectedVersion:number,content:DraftContent){return request<CaseDraft>('case-drafts/'+encodeURIComponent(id),{method:'PUT',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:expectedVersion,content})});}
export async function attachDraftDocument(id:string,expectedVersion:number,documentVersionId:string){return request<DraftDocumentState>('case-drafts/'+encodeURIComponent(id)+'/documents',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:expectedVersion,document_version_id:documentVersionId})});}
export async function detachDraftDocument(id:string,linkId:string,expectedVersion:number){return request<DraftDocumentState>('case-drafts/'+encodeURIComponent(id)+'/documents/'+encodeURIComponent(linkId)+'/detach',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:expectedVersion})});}
export function draftValidation(content:DraftContent):string{
  const code=content.product_details?.hs_code??'';
  if(code&&!/^[0-9]{6,12}$/.test(code))return 'کد HS باید ۶ تا ۱۲ رقم انگلیسی باشد؛ قالب عددی به‌معنی صحت طبقه‌بندی نیست.';
  if(content.quantity!==null&&(!Number.isInteger(content.quantity)||content.quantity<1||content.quantity>1_000_000_000))return 'تعداد باید عدد صحیح مثبت باشد.';
  for(const weight of [content.net_weight,content.gross_weight])if(weight!==null&&(!Number.isFinite(Number(weight))||Number(weight)<0))return 'وزن باید عدد نامنفی باشد.';
  if(content.net_weight!==null&&content.gross_weight!==null&&Number(content.gross_weight)<Number(content.net_weight))return 'وزن ناخالص نمی‌تواند کمتر از وزن خالص باشد.';
  return '';
}

