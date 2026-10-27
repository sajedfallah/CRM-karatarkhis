import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {ApiError,request} from '../api';
import {attachDraftDocument,detachDraftDocument,type CaseDraft,type DraftDocumentState} from '../drafts';
import {Button} from './Button';

const validity:Record<string,string>={VALID:'دارای اعتبار زمانی',EXPIRING_SOON:'نزدیک انقضا',EXPIRED:'منقضی‌شده',NOT_YET_VALID:'اعتبار هنوز آغاز نشده',UNKNOWN_EXPIRY:'انقضای نامشخص'};

export function DraftDocuments({record,disabled,onChanged,onReload}:{record:CaseDraft;disabled:boolean;onChanged:(version:number)=>void;onReload:()=>void}){
  const cache=useQueryClient();const [selected,setSelected]=useState('');
  const query=useQuery({queryKey:['draft-documents',record.id],queryFn:()=>request<DraftDocumentState>('case-drafts/'+encodeURIComponent(record.id)+'/documents'),refetchOnWindowFocus:false});
  const attach=useMutation({retry:false,mutationFn:()=>attachDraftDocument(record.id,record.version,selected),onSuccess:data=>{onChanged(data.draft_version);setSelected('');void cache.invalidateQueries({queryKey:['draft-documents',record.id]});void cache.invalidateQueries({queryKey:['case-drafts']});void cache.invalidateQueries({queryKey:['registration-readiness',record.id]});}});
  const detach=useMutation({retry:false,mutationFn:(linkId:string)=>detachDraftDocument(record.id,linkId,record.version),onSuccess:data=>{onChanged(data.draft_version);void cache.invalidateQueries({queryKey:['draft-documents',record.id]});void cache.invalidateQueries({queryKey:['case-drafts']});void cache.invalidateQueries({queryKey:['registration-readiness',record.id]});}});
  const error=attach.error??detach.error;const conflict=error instanceof ApiError&&error.status===409;
  return <section className="surface draft-editor"><h2>اتصال نسخهٔ مدارک مشتری</h2><p className="muted">نسخهٔ دقیق مجوز یا وکالت‌نامهٔ بارگذاری‌شده برای همین مشتری را انتخاب کنید. فایل جدید در اینجا بارگذاری نمی‌شود.</p>
    {disabled?<p role="status">ابتدا تغییرات پرونده را ذخیره کنید تا اتصال سند به نسخهٔ جاری انجام شود.</p>:query.isPending?<p role="status">در حال دریافت نسخه‌های مدارک…</p>:query.isError?<div role="alert"><p>دریافت مدارک مشتری انجام نشد.</p><Button type="button" variant="outline" onClick={()=>void query.refetch()}>تلاش دوباره</Button></div>:<>
      <h3 className="readiness-title">نسخه‌های متصل به پرونده · نسخهٔ اطلاعات {query.data.draft_version.toLocaleString('fa-IR')}</h3>
      {!query.data.linked.length?<p>هنوز نسخه‌ای به این پیش‌نویس متصل نشده است.</p>:<ul className="readiness-list">{query.data.linked.map(item=><li key={item.link_id}><span>{item.title} · نسخه {item.version.toLocaleString('fa-IR')} · {item.file_name} · {validity[item.status]||item.status}</span><Button type="button" variant="outline" disabled={attach.isPending||detach.isPending} onClick={()=>item.link_id&&detach.mutate(item.link_id)}>قطع اتصال</Button></li>)}</ul>}
      {!query.data.available.length?<p>نسخهٔ دیگری از مجوز یا وکالت‌نامه برای این مشتری موجود نیست.</p>:<div className="customer-grid"><label>انتخاب نسخهٔ مدرک<select value={selected} disabled={attach.isPending||detach.isPending} onChange={event=>setSelected(event.target.value)}><option value="">یک نسخه را انتخاب کنید</option>{query.data.available.map(item=><option key={item.document_version_id} value={item.document_version_id}>{item.title} · نسخه {item.version.toLocaleString('fa-IR')} · {validity[item.status]||item.status}</option>)}</select></label><div className="form-actions"><Button type="button" disabled={!selected||attach.isPending||detach.isPending} onClick={()=>attach.mutate()}>{attach.isPending?'در حال اتصال…':'اتصال نسخهٔ انتخاب‌شده'}</Button></div></div>}
    </>}
    {error&&<div className="form-error" role="alert"><p>{conflict?'نسخهٔ پرونده تغییر کرده است؛ برای جلوگیری از اتصال به نسخهٔ نادرست، دوباره اطلاعات را دریافت کنید.':'عملیات اتصال مدرک انجام نشد.'}</p>{conflict&&<Button type="button" variant="outline" onClick={onReload}>دریافت نسخهٔ تازهٔ پرونده</Button>}</div>}
    <p className="readiness-note">اتصال، نسخه و وضعیت اعتبار را ثبت می‌کند؛ اصالت، کفایت حقوقی یا الزام مدرک را تأیید نمی‌کند و فایل را برای مشتری ارسال نمی‌کند.</p>
  </section>;
}

