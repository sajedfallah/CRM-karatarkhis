import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {prepareWriteSession,request} from '../api';
import type {CaseDraft} from '../drafts';
import {Button} from './Button';

type Review={id:string;draft_id:string;draft_version:number;status:'PENDING'|'CONFIRMED'|'CHANGES_REQUESTED'|'STALE';snapshot:{customer_name:string;draft_version:number;content:Record<string,any>};decision_comment:string|null;requested_at:string};
type Recipient={membership_id:string;full_name:string;email:string|null};
const statusText:Record<Review['status'],string>={PENDING:'در انتظار بازبینی مشتری',CONFIRMED:'مشتری این نسخه را تأیید کرده',CHANGES_REQUESTED:'مشتری درخواست اصلاح داده',STALE:'نسخه تغییر کرده و این درخواست منقضی است'};
const operationText:Record<string,string>={import:'واردات',export:'صادرات',transit:'ترانزیت'};

function ReviewSnapshot({review}:{review:Review}){
  const c=review.snapshot.content,d=c.product_details||{},s=c.export_shipment||{};
  const rows:[string,unknown][]=[['عنوان پرونده',c.title],['نوع عملیات',operationText[c.operation_type]||c.operation_type],['گمرک',c.customs],['شرح کالا',c.product_description],['مرجع حمل / بارنامه',c.shipment_reference],['تعداد',c.quantity],['وزن خالص (کیلوگرم)',c.net_weight],['وزن ناخالص (کیلوگرم)',c.gross_weight],['برند',d.brand],['مدل',d.model],['جنس / مواد',d.material],['کاربرد',d.intended_use],['ویژگی‌های فنی',d.technical_attributes],['کشور سازنده / مبدأ',d.country_of_origin],['کد HS ثبت‌شده',d.hs_code]];
  if(c.operation_type==='export')rows.push(['نوع بسته‌بندی',s.package_type],['تعداد بسته',s.package_count],['ارزش کل',s.total_value],['ارز',s.currency],['موبایل راننده',s.driver_mobile],['خودرو / پلاک',s.vehicle_identifier]);
  return <dl className="customer-review-snapshot">{rows.filter(([,value])=>value!==null&&value!==undefined&&value!=='').map(([label,value])=><div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>;
}

export function DraftCustomerReviewAdmin({record,disabled}:{record:CaseDraft;disabled:boolean}){
  const cache=useQueryClient();const [recipientId,setRecipientId]=useState('');
  const state=useQuery({queryKey:['draft-customer-review',record.id,record.version],queryFn:()=>request<Review|null>(`case-drafts/${encodeURIComponent(record.id)}/customer-review`),enabled:!disabled,refetchOnWindowFocus:false});
  const recipients=useQuery({queryKey:['draft-review-recipients',record.customer_id],queryFn:()=>request<Recipient[]>(`case-drafts/${encodeURIComponent(record.id)}/review-recipients`),enabled:!disabled,refetchOnWindowFocus:false});
  const send=useMutation({retry:false,mutationFn:async()=>request<Review>(`case-drafts/${encodeURIComponent(record.id)}/customer-review`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:record.version,recipient_membership_id:recipientId})}),onSuccess:()=>{void cache.invalidateQueries({queryKey:['draft-customer-review',record.id]});}});
  const review=state.data;
  return <section className="surface draft-editor"><h2>بازبینی اطلاعات توسط مشتری</h2><p className="muted">پس از درخواست، مدیر مشتری همین نسخه را در حساب خود می‌بیند. این اقدام ایمیل نمی‌فرستد و پرونده را ثبت نهایی یا قفل نمی‌کند. برآورد مالی و مسئول پیشنهادی در نمای مشتری پنهان می‌مانند.</p>
    {disabled?<p role="status">پس از ذخیره نسخهٔ فعلی می‌توانید درخواست بازبینی کنید.</p>:state.isPending||recipients.isPending?<p role="status">در حال بررسی دسترسی مشتری…</p>:state.isError||recipients.isError?<p role="alert">اطلاعات بازبینی مشتری دریافت نشد.</p>:review?<><p><strong>وضعیت:</strong> {statusText[review.status]} · نسخه {review.draft_version.toLocaleString('fa-IR')}</p>{review.status==='CHANGES_REQUESTED'&&review.decision_comment&&<p>توضیح مشتری: {review.decision_comment}</p>}</>:<><label>مدیر مجاز مشتری<select value={recipientId} onChange={e=>setRecipientId(e.target.value)} disabled={!recipients.data?.length||send.isPending}><option value="">انتخاب مدیر مشتری</option>{recipients.data?.map(person=><option key={person.membership_id} value={person.membership_id}>{person.full_name}{person.email?' · '+person.email:''}</option>)}</select></label>{!recipients.data?.length&&<p>برای این مشتری هنوز مدیرِ فعال و تأییدشده‌ای برای بازبینی وجود ندارد.</p>}<Button disabled={!recipientId||send.isPending} onClick={()=>send.mutate()}>{send.isPending?'در حال ثبت درخواست…':'درخواست بازبینی این نسخه'}</Button></>}
    {send.isError&&<p role="alert">درخواست ثبت نشد؛ ممکن است نسخه تغییر کرده باشد. پرونده را تازه‌سازی و دوباره بررسی کنید.</p>}
  </section>;
}

export function CustomerDraftReviewsPage(){
  const cache=useQueryClient();const [selectedId,setSelectedId]=useState('');const [comment,setComment]=useState('');
  const inbox=useQuery({queryKey:['customer-draft-reviews'],queryFn:()=>request<Review[]>('case-drafts/customer-reviews'),refetchInterval:30000,refetchOnWindowFocus:true});
  const selected=inbox.data?.find(item=>item.id===selectedId)||inbox.data?.[0];
  const decide=useMutation({retry:false,mutationFn:async(input:{decision:'CONFIRMED'|'CHANGES_REQUESTED';comment:string})=>request<Review>(`case-drafts/customer-reviews/${encodeURIComponent(selected!.id)}/decision`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify(input)}),onSuccess:()=>{setComment('');void cache.invalidateQueries({queryKey:['customer-draft-reviews']});}});
  return <><div className="page-heading"><div><p className="eyebrow">درخواست‌های مشتری</p><h1>بازبینی اطلاعات پرونده</h1><p>فقط اطلاعات نسخه‌ای که مدیر داخلی برای سازمان شما فرستاده نمایش داده می‌شود.</p></div></div>
    <section className="surface draft-editor"><p className="muted">تأیید این مرحله فقط اعلام نظر دربارهٔ همین نسخهٔ پیش‌نویس است؛ ثبت نهایی پرونده، تعهد مالی یا قفل ایجاد نمی‌کند. اگر پیش‌نویس تغییر کند، نظر این نسخه دیگر قابل استفاده نیست.</p>
      {inbox.isPending?<p role="status">در حال دریافت درخواست‌ها…</p>:inbox.isError?<p role="alert">دریافت درخواست‌ها انجام نشد.</p>:!inbox.data.length?<p>درخواست بازبینی فعالی برای شما وجود ندارد.</p>:<>
        <label>درخواست<select value={selected?.id||''} onChange={e=>setSelectedId(e.target.value)}>{inbox.data.map(item=><option key={item.id} value={item.id}>{item.snapshot.customer_name} · {item.draft_id} · نسخه {item.draft_version.toLocaleString('fa-IR')} · {statusText[item.status]}</option>)}</select></label>
        {selected&&<><h2>{selected.snapshot.customer_name} · نسخه {selected.draft_version.toLocaleString('fa-IR')}</h2><p>شناسه پیش‌نویس: <bdi>{selected.draft_id}</bdi></p><ReviewSnapshot review={selected}/><p className="readiness-note">اطلاعات مالی داخلی و مسئول پیشنهادی در این صفحه نمایش داده نمی‌شوند.</p>{selected.status==='STALE'?<p role="status">این نسخه تغییر کرده است؛ از مدیر بخواهید نسخهٔ تازه را برای بازبینی بفرستد.</p>:selected.status==='PENDING'?<><label>توضیح اصلاح (در صورت درخواست اصلاح)<textarea maxLength={2000} rows={3} value={comment} onChange={e=>setComment(e.target.value)}/></label><div className="form-actions"><Button disabled={decide.isPending} onClick={()=>decide.mutate({decision:'CONFIRMED',comment:''})}>اطلاعات این نسخه را تأیید می‌کنم</Button><Button variant="outline" disabled={decide.isPending||comment.trim().length<3} onClick={()=>decide.mutate({decision:'CHANGES_REQUESTED',comment:comment.trim()})}>درخواست اصلاح</Button></div></>:<p><strong>نظر ثبت‌شده:</strong> {statusText[selected.status]}{selected.decision_comment?' · '+selected.decision_comment:''}</p>}</>}
      </>}{decide.isError&&<p role="alert">نظر ثبت نشد؛ ممکن است این نسخه تغییر کرده یا درخواست قبلاً پاسخ داده شده باشد.</p>}
    </section></>;
}
