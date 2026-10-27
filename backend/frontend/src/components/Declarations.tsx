import {useRef,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,prepareWriteSession,ApiError,type RecordRow} from '../api';
import {Button} from './Button';

type Version={id:string;case_id:string;version:number;file_name:string;status:string;request_id:string|null;comment:string|null;decision:string|null};
type Reviewer={membership_id:string;name:string};
const statuses:Record<string,string>={uploaded:'بارگذاری‌شده؛ هنوز ارسال نشده',pending:'در انتظار بررسی مشتری',approved:'تأیید مشتری',correction_required:'درخواست اصلاح مشتری',superseded:'نسخه قبلی'};
async function command(path:string,body:unknown){const csrf=await prepareWriteSession();return request('declarations/'+path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(body)});}

function CaseDeclarations({caseId,admin}:{caseId:string;admin:boolean}){
  const cache=useQueryClient();const input=useRef<HTMLInputElement>(null);
  const [uploadId,setUploadId]=useState(()=>crypto.randomUUID());const [recipient,setRecipient]=useState('');const [notice,setNotice]=useState('');
  const [comment,setComment]=useState('');const [confirm,setConfirm]=useState(false);
  const versions=useQuery({queryKey:['declarations',caseId],queryFn:()=>request<Version[]>('declarations/cases/'+encodeURIComponent(caseId)),refetchInterval:30000});
  const reviewers=useQuery({queryKey:['declaration-reviewers',caseId],queryFn:()=>request<Reviewer[]>('declarations/cases/'+encodeURIComponent(caseId)+'/reviewers'),enabled:admin});
  async function refresh(){await Promise.all([cache.invalidateQueries({queryKey:['declarations',caseId]}),cache.invalidateQueries({queryKey:['declaration-inbox']})]);}
  const upload=useMutation({retry:false,mutationFn:async()=>{const file=input.current?.files?.[0];if(!file||!file.size||file.size>3*1024*1024)throw new Error('یک فایل PDF، PNG یا JPEG با حجم حداکثر ۳ مگابایت انتخاب کنید.');const csrf=await prepareWriteSession();const body=new FormData();body.set('file',file);body.set('upload_id',uploadId);return request('declarations/cases/'+encodeURIComponent(caseId),{method:'POST',body,headers:{'X-CSRF-Token':csrf}});},onSuccess:async()=>{setUploadId(crypto.randomUUID());if(input.current)input.current.value='';setNotice('نسخه جدید ذخیره شد. برای ارسال، مشتری دارای دسترسی را انتخاب کنید.');await refresh();}});
  const send=useMutation({retry:false,mutationFn:(id:string)=>command(encodeURIComponent(id)+'/send',{recipient_membership_id:recipient}),onSuccess:async()=>{setNotice('سند در کارتابل بررسی مشتری قرار گرفت.');await refresh();}});
  const decision=useMutation({retry:false,mutationFn:(value:{id:string;decision:string})=>command(encodeURIComponent(value.id)+'/decision',{decision:value.decision,comment:comment.trim()||null}),onSuccess:async()=>{setComment('');setConfirm(false);setNotice('نظر شما روی این نسخه ثبت شد.');await refresh();}});
  const pending=upload.isPending||send.isPending||decision.isPending;
  const error=upload.error||send.error||decision.error;
  const current=versions.data?.[0];
  function submit(event:FormEvent){event.preventDefault();if(!pending)upload.mutate();}
  return <><p className="muted">فایل پیش‌نویس اظهارنامه را از سامانه مبدأ دریافت کنید. هر اصلاح، نسخه جدید می‌سازد و نیازمند تأیید مجدد مشتری است.</p>
    {admin&&<form className="surface draft-editor" onSubmit={submit}><h2>بارگذاری پیش‌نویس اظهارنامه</h2><label>فایل سند<input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg" required disabled={pending} onChange={()=>{setUploadId(crypto.randomUUID());upload.reset();}}/></label><p>PDF، PNG یا JPEG؛ حداکثر ۳ مگابایت. بارگذاری، سند را خودکار برای مشتری ارسال نمی‌کند.</p><Button type="submit" disabled={pending}>{upload.isPending?'در حال بارگذاری…':'ذخیره نسخه جدید'}</Button></form>}
    {notice&&<p role="status" className="save-notice">{notice}</p>}
    {error&&<p role="alert" className="form-error">{error instanceof ApiError&&error.status===409?'نسخه سند یا وضعیت بررسی تغییر کرده است؛ فهرست را تازه کنید.':error.message}</p>}
    {versions.isPending?<p role="status">در حال دریافت اسناد…</p>:versions.isError?<p role="alert">دریافت اسناد انجام نشد.</p>:!versions.data.length?<p>هنوز سندی برای بررسی در دسترس نیست.</p>:versions.data.map(version=><article className="surface draft-editor" key={version.id}><h2>پیش‌نویس اظهارنامه · نسخه {version.version.toLocaleString('fa-IR')}</h2><p>{statuses[version.status]}</p><a className="record-link" href={'/api/v1/declarations/'+encodeURIComponent(version.id)+'/file'} download>دریافت {version.file_name}</a>{version.comment&&<p>نظر مشتری: {version.comment}</p>}
      {admin&&version.status==='uploaded'&&<div><label>بررسی‌کننده سمت مشتری<select value={recipient} disabled={pending} onChange={e=>setRecipient(e.target.value)}><option value="">انتخاب کاربر مشتری</option>{reviewers.data?.map(r=><option key={r.membership_id} value={r.membership_id}>{r.name}</option>)}</select></label>{reviewers.isPending?<p>در حال دریافت کاربران…</p>:reviewers.isError?<p role="alert">دریافت کاربران مجاز انجام نشد.</p>:!reviewers.data.length?<p>مشتری هنوز کاربر فعال با اجازه تأیید اسناد ندارد؛ ابتدا دسترسی پرتال او باید آماده شود.</p>:null}<Button disabled={pending||!reviewers.data?.some(r=>r.membership_id===recipient)} onClick={()=>send.mutate(version.id)}>ارسال به کارتابل مشتری</Button></div>}
      {!admin&&current?.id===version.id&&version.status==='pending'&&<div><label>توضیح یا موارد اصلاح<textarea maxLength={2000} value={comment} disabled={pending} onChange={e=>setComment(e.target.value)}/></label><label><input type="checkbox" checked={confirm} disabled={pending} onChange={e=>setConfirm(e.target.checked)}/>فایل همین نسخه را بررسی کرده‌ام و آن را تأیید می‌کنم.</label><div className="form-actions"><Button disabled={pending||!confirm} onClick={()=>decision.mutate({id:version.id,decision:'approved'})}>تأیید این نسخه</Button><Button variant="outline" disabled={pending||!comment.trim()} onClick={()=>decision.mutate({id:version.id,decision:'correction_required'})}>درخواست اصلاح</Button></div></div>}
    </article>)}
  </>;
}

export function DeclarationsPage({admin}:{admin:boolean}){
  const [caseId,setCaseId]=useState(()=>new URLSearchParams(location.search).get('case')??'');
  const cases=useQuery({queryKey:['declaration-cases'],queryFn:()=>request<RecordRow[]>('cases')});
  const inbox=useQuery({queryKey:['declaration-inbox'],queryFn:()=>request<Version[]>('declarations/inbox'),enabled:!admin,refetchInterval:30000});
  function select(id:string){setCaseId(id);history.replaceState(null,'','/app/declarations'+(id?'?case='+encodeURIComponent(id):''));}
  return <><div className="page-heading"><div><p className="eyebrow">بررسی سند توسط مشتری</p><h1>پیش‌نویس اظهارنامه</h1><p>این بخش برای بررسی سند است؛ اظهار گمرکی و ثبت نهایی پرونده از این صفحه انجام نمی‌شود.</p></div></div>
    {!admin&&!!inbox.data?.length&&<section className="surface draft-editor"><h2>نیازمند اقدام شما</h2>{inbox.data.map(v=><p key={v.id}><Button variant="outline" onClick={()=>select(v.case_id)}>بررسی نسخه {v.version.toLocaleString('fa-IR')} · {v.case_id}</Button></p>)}</section>}
    <section className="surface draft-editor"><label>پرونده واردات<select value={caseId} onChange={e=>select(e.target.value)}><option value="">پرونده را انتخاب کنید</option>{cases.data?.filter(c=>c.operation_type==='import').map(c=><option key={c.id} value={c.id}>{String(c.real_case_number||c.id)}</option>)}</select></label>{cases.isPending?<p role="status">در حال دریافت پرونده‌ها…</p>:cases.isError?<p role="alert">دریافت پرونده‌ها انجام نشد.</p>:!cases.data.some(c=>c.operation_type==='import')?<p>پرونده وارداتی ثبت‌شده‌ای در محدوده دسترسی شما وجود ندارد. «پرونده‌های در حال ثبت» هنوز پرونده نهایی نیستند.</p>:null}</section>
    {caseId&&<CaseDeclarations key={caseId} caseId={caseId} admin={admin}/>}
  </>;
}
