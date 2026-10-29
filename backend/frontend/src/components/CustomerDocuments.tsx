import {useRef,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,prepareWriteSession} from '../api';
import {Button} from './Button';

type Version={id:string;version:number;file_name:string;starts_on:string|null;expires_on:string|null;remind_days:number;status:string;remaining_days:number|null};
type CorporateDocument={id:string;title:string;document_type:'license'|'power_of_attorney';versions:Version[]};
const statuses:Record<string,string>={VALID:'دارای اعتبار زمانی',EXPIRED:'منقضی‌شده',EXPIRING_SOON:'نزدیک انقضا',NOT_YET_VALID:'شروع اعتبار در آینده',UNKNOWN_EXPIRY:'تاریخ انقضا ثبت نشده'};
function dateLabel(value:string|null){return value?new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeZone:'Asia/Tehran'}).format(new Date(value+'T12:00:00Z')):'—';}

export function CustomerDocuments({customerId}:{customerId:string}){
  const cache=useQueryClient();const input=useRef<HTMLInputElement>(null);
  const query=useQuery({queryKey:['customer-documents',customerId],queryFn:()=>request<CorporateDocument[]>('customers/'+encodeURIComponent(customerId)+'/corporate-documents')});
  const [form,setForm]=useState<{document:CorporateDocument|null}|null>(null);
  const [kind,setKind]=useState<'license'|'power_of_attorney'>('power_of_attorney');const [title,setTitle]=useState('');
  const [starts,setStarts]=useState('');const [expires,setExpires]=useState('');const [days,setDays]=useState(30);
  const storage=useQuery({queryKey:['document-storage'],queryFn:()=>request<{ready:boolean}>('corporate-document-storage/status'),enabled:!!form,retry:false});
  const [uploadId,setUploadId]=useState(()=>crypto.randomUUID());const [notice,setNotice]=useState('');
  function open(document:CorporateDocument|null){setForm({document});setKind(document?.document_type??'power_of_attorney');setTitle(document?.title??'');setStarts('');setExpires('');setDays(30);setUploadId(crypto.randomUUID());setNotice('');save.reset();}
  function changed(){setUploadId(crypto.randomUUID());}
  const save=useMutation({retry:false,mutationFn:async()=>{
    const file=input.current?.files?.[0];if(!file)throw new Error('فایل مدرک را انتخاب کنید.');
    if(file.size===0||file.size>3*1024*1024)throw new Error('حجم فایل باید بیشتر از صفر و حداکثر ۳ مگابایت باشد.');
    if(starts&&expires&&expires<starts)throw new Error('تاریخ انقضا باید پس از تاریخ شروع باشد.');
    const csrf=await prepareWriteSession();const body=new FormData();
    body.set('file',file);body.set('upload_id',uploadId);body.set('document_type',kind);body.set('title',title.trim());body.set('remind_days',String(days));
    if(starts)body.set('starts_on',starts);if(expires)body.set('expires_on',expires);
    if(form?.document)body.set('document_id',form.document.id);
    return request('customers/'+encodeURIComponent(customerId)+'/corporate-documents',{method:'POST',body,headers:{'X-CSRF-Token':csrf}});
  },onSuccess:async()=>{setForm(null);setNotice('مدرک ذخیره شد.');await Promise.all([cache.invalidateQueries({queryKey:['customer-documents',customerId]}),cache.invalidateQueries({queryKey:['notifications']})]);}});
  function submit(event:FormEvent){event.preventDefault();if(!save.isPending)save.mutate();}
  return <section className="customer-documents"><h3>مجوزها و وکالت‌نامه‌ها</h3><p className="muted">فایل‌های خصوصی مشتری · هشدار انقضا در اعلان‌های پنل</p>
    {!form&&<Button variant="outline" onClick={()=>open(null)}>بارگذاری مدرک</Button>}
    {notice&&<p role="status" className="save-notice">{notice}</p>}
    {form&&<form className="document-upload" onSubmit={submit}><h4>{form.document?'بارگذاری نسخه جدید':'مدرک جدید'}</h4>
      <label>نوع مدرک<select value={kind} disabled={!!form.document||save.isPending} onChange={e=>{setKind(e.target.value as typeof kind);changed();}}><option value="power_of_attorney">وکالت‌نامه</option><option value="license">مجوز</option></select></label>
      <label>عنوان مدرک<input required minLength={2} maxLength={255} value={title} disabled={!!form.document||save.isPending} onChange={e=>{setTitle(e.target.value);changed();}}/></label>
      <div className="customer-grid"><label>تاریخ شروع اعتبار (میلادی)<input type="date" required={kind==='power_of_attorney'} value={starts} disabled={save.isPending} onChange={e=>{setStarts(e.target.value);changed();}}/></label>
      <label>تاریخ انقضا (میلادی)<input type="date" required={kind==='power_of_attorney'} min={starts||undefined} value={expires} disabled={save.isPending} onChange={e=>{setExpires(e.target.value);changed();}}/></label></div>
      <small>هر دو تاریخ برای وکالت‌نامه الزامی است. مجوز بدون تاریخ انقضا، هشدار انقضا ندارد.</small>
      <label>هشدار از چند روز قبل از انقضا<input type="number" min={1} max={365} required value={days} disabled={save.isPending} onChange={e=>{setDays(Number(e.target.value));changed();}}/></label>
      <label>فایل مدرک<input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" required disabled={save.isPending} onChange={changed}/></label><small>PDF، PNG یا JPEG؛ حداکثر ۳ مگابایت. جایگزینی، نسخه جدید می‌سازد و نسخه قبلی باقی می‌ماند.</small>
      {storage.isPending&&<p role="status">در حال آماده‌سازی بارگذاری…</p>}{storage.isError&&<div role="alert"><p className="form-error">بارگذاری فایل فعلاً در دسترس نیست.</p><Button type="button" variant="outline" onClick={()=>void storage.refetch()}>تلاش دوباره</Button></div>}
      {save.isError&&<p role="alert" className="form-error">{save.error.message}</p>}
      <div className="form-actions"><Button type="submit" disabled={save.isPending||storage.isPending||storage.isError}>{save.isPending?'در حال بارگذاری…':'ذخیره مدرک'}</Button><Button type="button" variant="outline" disabled={save.isPending} onClick={()=>setForm(null)}>انصراف</Button></div>
    </form>}
    {query.isPending?<p role="status">در حال دریافت مدارک…</p>:query.isError?<p role="alert">دریافت مدارک انجام نشد.</p>:query.data.length===0?<p className="muted">هنوز مدرکی برای این مشتری ثبت نشده است.</p>:query.data.map(document=><article className="corporate-document" key={document.id}>
      <h4>{document.title}</h4><span className={'document-status '+document.versions[0]?.status}>{statuses[document.versions[0]?.status]}</span>
      {document.versions.map((version,index)=><div className="document-version" key={version.id}><strong>نسخه {version.version.toLocaleString('fa-IR')}{index>0?' · نسخه قبلی':''}</strong>
        <p>شروع: {dateLabel(version.starts_on)} · انقضا: {dateLabel(version.expires_on)}</p>
        <a className="record-link" href={'/api/v1/customers/'+encodeURIComponent(customerId)+'/corporate-documents/'+encodeURIComponent(version.id)+'/file'} download>دریافت فایل: {version.file_name}</a></div>)}
      <Button variant="outline" disabled={save.isPending} onClick={()=>open(document)}>نسخه جدید</Button></article>)}
  </section>;
}
