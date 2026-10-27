import {useEffect,useState,type FormEvent} from 'react';
import {useBlocker} from '@tanstack/react-router';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,ApiError,type RecordRow} from '../api';
import {createDraft,saveDraft,draftValidation,emptyProductDetails,emptyExportShipment,type CaseDraft,type DraftContent} from '../drafts';
import {ProductReview} from './ProductReview';
import {RegistrationReadiness} from './RegistrationReadiness';
import {Button} from './Button';

const operations:Record<string,string>={import:'واردات',export:'صادرات',transit:'ترانزیت'};
const same=(a:DraftContent,b:DraftContent)=>JSON.stringify(a)===JSON.stringify(b);

function DraftEditor({initial,onClose,onReload}:{initial:CaseDraft;onClose:()=>void;onReload:()=>void}){
  const [record,setRecord]=useState(initial);const [content,setContent]=useState<DraftContent>(initial.content);
  const details=content.product_details??emptyProductDetails;
  const shipment=content.export_shipment??emptyExportShipment;
  const cache=useQueryClient();const dirty=!same(content,record.content);const invalid=draftValidation(content);
  const save=useMutation({retry:false,mutationFn:(input:{version:number;content:DraftContent})=>saveDraft(record.id,input.version,input.content),
    onSuccess:(data,input)=>{setRecord(data);setContent(current=>same(current,input.content)?data.content:current);void cache.invalidateQueries({queryKey:['case-drafts']});}});
  const conflict=save.error instanceof ApiError&&save.error.status===409;
  const blocker=useBlocker({shouldBlockFn:()=>dirty||save.isPending,enableBeforeUnload:dirty||save.isPending,withResolver:true});
  useEffect(()=>{if(!dirty||invalid||save.isPending||save.isError)return;const timer=setTimeout(()=>save.mutate({version:record.version,content}),1200);return()=>clearTimeout(timer);},[content,dirty,invalid,record.version,save.isPending,save.isError,save.mutate]);
  function change<K extends keyof DraftContent>(key:K,value:DraftContent[K]){setContent(previous=>({...previous,[key]:value}));}
  function submit(event:FormEvent){event.preventDefault();if(dirty&&!invalid&&!save.isPending&&!conflict)save.mutate({version:record.version,content});}
  return <><div className="page-heading"><div><p className="eyebrow">پرونده در حال ثبت</p><h1>{record.customer_name}</h1><p>اطلاعات اولیه پرونده را تکمیل کنید؛ ثبت نهایی هنوز انجام نشده است.</p></div><Button variant="outline" disabled={dirty||save.isPending} onClick={onClose}>بازگشت به فهرست</Button></div>
    <section className="surface draft-editor"><div className="draft-save-status" role="status">{save.isPending?'در حال ذخیره…':dirty?'تغییرات ذخیره‌نشده دارید.':'همه تغییرات ذخیره شده است.'}<small>نسخه {record.version.toLocaleString('fa-IR')}</small></div>
    <form onSubmit={submit}><fieldset><legend>مشتری و عملیات</legend><div className="customer-grid">
      <label>عنوان پرونده<input maxLength={200} value={content.title} onChange={e=>change('title',e.target.value)}/></label>
      <label>نوع عملیات<select value={content.operation_type??''} onChange={e=>change('operation_type',(e.target.value||null) as DraftContent['operation_type'])}><option value="">انتخاب نشده</option><option value="import">واردات</option><option value="export">صادرات</option><option value="transit">ترانزیت</option></select></label>
      <label>گمرک<input maxLength={64} value={content.customs} onChange={e=>change('customs',e.target.value)}/></label>
    </div></fieldset><fieldset><legend>اطلاعات اولیه کالا و حمل</legend>
      <label>شرح کالا<textarea maxLength={2000} rows={4} value={content.product_description} onChange={e=>change('product_description',e.target.value)}/></label>
      <div className="customer-grid"><label>مرجع حمل / بارنامه<input maxLength={128} value={content.shipment_reference} onChange={e=>change('shipment_reference',e.target.value)}/></label>
      <label>تعداد<input type="number" min={1} max={1000000000} step={1} value={content.quantity??''} onChange={e=>change('quantity',e.target.value===''?null:Number(e.target.value))}/></label>
      <label>وزن خالص (کیلوگرم)<input type="number" min={0} step="0.001" value={content.net_weight??''} onChange={e=>change('net_weight',e.target.value||null)}/></label>
      <label>وزن ناخالص (کیلوگرم)<input type="number" min={0} step="0.001" value={content.gross_weight??''} onChange={e=>change('gross_weight',e.target.value||null)}/></label></div>
    </fieldset><fieldset><legend>مشخصات فنی کالا و کد HS</legend><div className="customer-grid">
      {([{key:'brand',label:'برند'},{key:'model',label:'مدل'},{key:'country_of_origin',label:'کشور سازنده / مبدأ'},{key:'hs_code',label:'کد HS پیشنهادی'}] as const).map(field=><label key={field.key}>{field.label}<input maxLength={field.key==='hs_code'?12:field.key==='country_of_origin'?100:120} inputMode={field.key==='hs_code'?'numeric':undefined} value={details[field.key]} onChange={e=>change('product_details',{...details,[field.key]:e.target.value})}/></label>)}
      <label className="full-width">جنس / مواد تشکیل‌دهنده<textarea maxLength={500} value={details.material} onChange={e=>change('product_details',{...details,material:e.target.value})}/></label>
      <label className="full-width">کاربرد کالا<textarea maxLength={1000} value={details.intended_use} onChange={e=>change('product_details',{...details,intended_use:e.target.value})}/></label>
      <label className="full-width">ویژگی‌های فنی<textarea rows={4} maxLength={4000} value={details.technical_attributes} onChange={e=>change('product_details',{...details,technical_attributes:e.target.value})}/></label>
    </div><p className="muted">کد HS ورودی انسانی است. ثبت آن به‌تنهایی تأیید کارشناسی محسوب نمی‌شود.</p></fieldset>{content.operation_type==='export'&&<fieldset><legend>جزئیات حمل صادراتی</legend><div className="customer-grid">
      <label>نوع بسته‌بندی<input maxLength={100} value={shipment.package_type} onChange={e=>change('export_shipment',{...shipment,package_type:e.target.value})}/></label>
      <label>تعداد بسته<input type="number" min={1} max={1000000000} step={1} value={shipment.package_count??''} onChange={e=>change('export_shipment',{...shipment,package_count:e.target.value===''?null:Number(e.target.value)})}/></label>
      <label>ارزش کل<input type="number" min={0} step="0.01" value={shipment.total_value??''} onChange={e=>change('export_shipment',{...shipment,total_value:e.target.value||null})}/></label>
      <label>ارز سه‌حرفی<input maxLength={3} autoCapitalize="characters" placeholder="USD" value={shipment.currency} onChange={e=>change('export_shipment',{...shipment,currency:e.target.value.toUpperCase()})}/></label>
      <label>موبایل راننده<input type="tel" maxLength={32} value={shipment.driver_mobile} onChange={e=>change('export_shipment',{...shipment,driver_mobile:e.target.value})}/></label>
      <label>خودرو / پلاک<input maxLength={128} value={shipment.vehicle_identifier} onChange={e=>change('export_shipment',{...shipment,vehicle_identifier:e.target.value})}/></label>
    </div><p className="muted">این مشخصات فقط برای عملیات صادرات نمایش داده می‌شود. ثبت آن‌ها هنوز بسته‌بندی نهایی یا ثبت پرونده نیست.</p></fieldset>}{invalid&&<p className="form-error" role="alert">{invalid}</p>}
    {save.isError&&<div className="form-error" role="alert"><p>{conflict?'اطلاعات این پرونده در جای دیگری تغییر کرده است. برای جلوگیری از بازنویسی، ذخیره متوقف شد.':'ذخیره انجام نشد. اطلاعات شما در فرم باقی مانده است؛ دوباره ذخیره کنید.'}</p>
      {conflict&&<><p>با دریافت نسخه جدید، تغییرات ذخیره‌نشده این فرم کنار گذاشته می‌شوند.</p><Button type="button" variant="outline" onClick={onReload}>دریافت نسخه جدید</Button></>}</div>}
    <div className="form-actions"><Button type="submit" disabled={!dirty||!!invalid||save.isPending||conflict}>ذخیره اطلاعات</Button>{dirty&&!save.isPending&&<Button type="button" variant="ghost" onClick={onClose}>بستن بدون ذخیره تغییرات</Button>}</div>
    </form></section><ProductReview record={record} unsaved={dirty||save.isPending} onReviewed={data=>{setRecord(current=>data.version>=current.version?data:current);void cache.invalidateQueries({queryKey:['registration-readiness',record.id]});}}/><RegistrationReadiness id={record.id} version={record.version} unsaved={dirty||save.isPending} onReload={onReload}/>{blocker.status==='blocked'&&<div className="draft-navigation-alert" role="alert"><p>{dirty||save.isPending?'تغییرات هنوز ذخیره نشده است.':'تغییرات ذخیره شد؛ می‌توانید ادامه دهید.'}</p><Button onClick={blocker.reset}>ماندن در فرم</Button><Button variant="outline" disabled={save.isPending} onClick={blocker.proceed}>{dirty?'خروج بدون ذخیره تغییرات':'ادامه'}</Button></div>}</>;
}

function DraftLoader({id,onClose}:{id:string;onClose:()=>void}){
  const query=useQuery({queryKey:['case-draft',id],queryFn:()=>request<CaseDraft>('case-drafts/'+encodeURIComponent(id)),staleTime:0,refetchOnMount:'always',refetchOnWindowFocus:false});
  if(query.isPending||query.isFetching)return <p role="status">در حال دریافت اطلاعات پرونده…</p>;
  if(query.isError)return <section className="surface draft-editor"><p role="alert">دریافت اطلاعات پرونده انجام نشد.</p><Button onClick={()=>void query.refetch()}>تلاش دوباره</Button><Button variant="outline" onClick={onClose}>بازگشت</Button></section>;
  return <DraftEditor key={id+':'+query.dataUpdatedAt} initial={query.data} onClose={onClose} onReload={()=>void query.refetch()}/>;
}

export function DraftsPage({allowed}:{allowed:boolean}){
  const cache=useQueryClient();const [opened,setOpened]=useState(()=>new URLSearchParams(location.search).get('draft'));
  const [customer,setCustomer]=useState(()=>new URLSearchParams(location.search).get('customer')??'');const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
  const customers=useQuery({queryKey:['records',null,'draft-customers'],queryFn:()=>request<RecordRow[]>('customers'),enabled:allowed});
  const drafts=useQuery({queryKey:['case-drafts'],queryFn:()=>request<CaseDraft[]>('case-drafts'),enabled:allowed});
  function open(id:string){history.replaceState(null,'','/app/drafts?draft='+encodeURIComponent(id));setOpened(id);}
  function close(){history.replaceState(null,'','/app/drafts');setOpened(null);}
  const create=useMutation({retry:false,mutationFn:()=>createDraft(customer,requestId),onSuccess:data=>{void cache.invalidateQueries({queryKey:['case-drafts']});setRequestId(crypto.randomUUID());open(data.id);}});
  if(!allowed)return <p role="alert">دسترسی به پرونده‌های در حال ثبت برای این نقش فعال نیست.</p>;
  if(opened)return <DraftLoader id={opened} onClose={close}/>;
  return <><div className="page-heading"><div><p className="eyebrow">ثبت اولیه پرونده</p><h1>پرونده‌های در حال ثبت</h1><p>اطلاعات اولیه را ذخیره کنید و بعداً ادامه دهید. برای دیدن مراحل تکمیل، یک پرونده ذخیره‌شده را باز کنید. پیش‌نویس اظهارنامه سند جداگانه‌ای در گروه پرونده‌ها است.</p></div></div>
    <section className="surface draft-editor"><h2>شروع ثبت پرونده جدید</h2><label htmlFor="draft-customer">مشتری</label><select id="draft-customer" value={customer} disabled={create.isPending} onChange={e=>{setCustomer(e.target.value);setRequestId(crypto.randomUUID());}}><option value="">مشتری را انتخاب کنید</option>{customers.data?.filter(c=>c.is_active).map(c=><option key={c.id} value={c.id}>{String(c.name)}</option>)}</select>
      {customers.isError&&<p role="alert">دریافت مشتریان انجام نشد.</p>}{create.isError&&<p role="alert" className="form-error">شروع ثبت پرونده انجام نشد؛ دوباره تلاش کنید.</p>}
      <Button disabled={!customers.data?.some(c=>c.id===customer&&c.is_active)||customers.isPending||create.isPending} onClick={()=>create.mutate()}>{create.isPending?'در حال ایجاد…':'شروع ثبت پرونده'}</Button></section>
    <section className="surface draft-list"><h2>ادامه ثبت پرونده‌ها</h2>{drafts.isPending?<p role="status">در حال دریافت…</p>:drafts.isError?<p role="alert">دریافت فهرست انجام نشد.</p>:!drafts.data.length?<p>هنوز پرونده‌ای در حال ثبت ندارید.</p>:drafts.data.map(draft=><article key={draft.id}><div><strong>{draft.content.title||'پرونده بدون عنوان'}</strong><p>{draft.customer_name} · {operations[draft.content.operation_type??'']||'نوع عملیات انتخاب نشده'}</p></div><Button variant="outline" onClick={()=>open(draft.id)}>ادامه و ویرایش</Button></article>)}</section></>;
}

