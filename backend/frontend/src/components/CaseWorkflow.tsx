import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,prepareWriteSession,ApiError} from '../api';
import {Button} from './Button';

type WorkflowEvent={route:'GREEN'|'YELLOW'|'RED';stage:string;comment:string|null;actor_user_id:string|null;created_at:string};
type Workflow={case_id:string;operation_type:'import'|'export';route:'GREEN'|'YELLOW'|'RED'|null;route_label:string|null;stage:string|null;next_stage:string|null;next_stages:string[];history:WorkflowEvent[];workflow_note:string|null};
const routeNames={GREEN:'سبز',YELLOW:'زرد',RED:'قرمز'};
const greenStages=['ارجاع برای پرداخت حقوق و عوارض گمرکی','کارشناس مجازی تأیید شد','پرداخت حقوق و عوارض گمرکی ثبت شد','درب خروج تأیید شد','بیجک صادر شد','بیجک ارسال شد','تحویل و تسویه ثبت شد'];
const greenNextActions=['پرونده را برای بررسی کارشناس مجازی ارجاع دهید.','مدرک پرداخت حقوق و عوارض را ثبت کنید.','تأیید درب خروج را ثبت کنید.','بیجک را صادر کنید.','بیجک صادرشده را برای مشتری بفرستید.','پس از تحویل کالا، تحویل و تسویه را ثبت کنید.','پرونده بسته است؛ اقدام دیگری لازم نیست.'];
const importInstructions:Record<string,string>={
  'مسیر سبز انتخاب شد':'بررسی کنید مجوز یا استاندارد برای این کالا لازم است یا خیر.',
  'بررسی نیاز مجوز/استاندارد انجام شد':'یکی از دو نتیجهٔ نیاز نداشتن یا دریافت و تأیید مجوز را ثبت کنید.',
  'مجوز/استاندارد لازم نیست':'پرداخت حقوق و عوارض گمرکی را ثبت کنید.',
  'مجوز/استاندارد دریافت و تأیید شد':'پرداخت حقوق و عوارض گمرکی را ثبت کنید.',
  'مسیر زرد انتخاب شد':'بررسی کارشناس مجازی را آغاز کنید.',
  'مسیر قرمز انتخاب شد':'ارزیابی فیزیکی کالا را آغاز کنید.',
  'ارزیابی فیزیکی آغاز شد':'نتیجه و تأیید یا یافته‌های ارزیابی را ثبت کنید.',
  'نتیجه ارزیابی فیزیکی ثبت شد':'پرونده را برای بررسی کارشناس مجازی بفرستید.',
  'بررسی کارشناس مجازی آغاز شد':'درخواست مدرک/اصلاح تکمیلی را ثبت کنید یا تأیید کارشناس را ثبت کنید.',
  'مدرک یا اصلاح تکمیلی درخواست شد':'پس از دریافت، پاسخ و مدرک تکمیلی را ثبت کنید.',
  'مدرک یا اصلاح تکمیلی دریافت شد':'بررسی کارشناس مجازی را دوباره آغاز کنید.',
  'تأیید کارشناس مجازی ثبت شد':'پرداخت حقوق و عوارض گمرکی را ثبت کنید.',
  'پرداخت حقوق و عوارض گمرکی ثبت شد':'تأیید درب خروج را ثبت کنید.',
  'درب خروج تأیید شد':'تکمیل تشریفات و بسته‌شدن پرونده را ثبت کنید.',
  'پرونده تکمیل شد':'پرونده بسته شد؛ اقدام دیگری لازم نیست.',
};

export function CaseWorkflow({caseId}:{caseId:string}){
  const cache=useQueryClient();const [route,setRoute]=useState<keyof typeof routeNames>('GREEN');const [comment,setComment]=useState('');const [notice,setNotice]=useState('');const [nextStageChoice,setNextStageChoice]=useState('');
  const query=useQuery({queryKey:['case-workflow',caseId],queryFn:()=>request<Workflow>('cases/'+encodeURIComponent(caseId)+'/workflow')});
  const transition=useMutation({retry:false,mutationFn:async(payload:{route?:string;stage?:string;comment?:string|null})=>{const csrf=await prepareWriteSession();return request<Workflow>('cases/'+encodeURIComponent(caseId)+'/workflow',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(payload)});},onSuccess:async(data)=>{setComment('');setNotice('مرحلهٔ پرونده ثبت شد.');await cache.setQueryData(['case-workflow',caseId],data);await cache.invalidateQueries({queryKey:['records','cases']});}});
  if(query.isPending)return <section className="surface draft-editor"><h2>گردش عملیاتی صادرات</h2><p role="status">در حال دریافت تاریخچه…</p></section>;
  if(query.isError)return <section className="surface draft-editor"><h2>گردش عملیاتی صادرات</h2><p role="alert">دریافت گردش کار انجام نشد. دسترسی پرونده را بررسی کنید.</p><Button variant="outline" onClick={()=>void query.refetch()}>تلاش دوباره</Button></section>;
  const state=query.data;const busy=transition.isPending;const isImport=state.operation_type==='import';
  const nextStages=state.next_stages??(state.next_stage?[state.next_stage]:[]);
  const chosenNextStage=nextStages.includes(nextStageChoice)?nextStageChoice:nextStages[0];
  const greenCompleted=greenStages.filter(stage=>state.history.some(event=>event.stage===stage));
  const currentGreenStage=state.route==='GREEN'?state.next_stage??state.stage:null;
  const title=isImport?'گردش عملیاتی واردات':'گردش عملیاتی صادرات';
  return <section className="surface draft-editor case-workflow"><div className="surface-heading"><div><h2>{title}</h2><p>مسیر گمرکی و اقدامات بعد از ثبت کوتاژ</p></div><span className="status-badge">{state.stage||'مسیر ثبت نشده'}</span></div>
    {notice&&<p role="status" className="save-notice">{notice}</p>}
    {transition.isError&&<p role="alert" className="form-error">{(transition.error as ApiError).status===403?'برای این مرحله مجوز داخلی یا مالی لازم است.':(transition.error as ApiError).status===409?'این گذار با ترتیب گردش کار سازگار نیست؛ اطلاعات را تازه کنید.':'ثبت مرحله انجام نشد.'}</p>}
    {!state.route?<div className="workflow-action"><label>مسیر اعلام‌شدهٔ گمرک<select value={route} disabled={busy} onChange={event=>setRoute(event.target.value as keyof typeof routeNames)}><option value="GREEN">سبز</option><option value="YELLOW">زرد</option><option value="RED">قرمز</option></select></label><Button disabled={busy} onClick={()=>transition.mutate({route,comment:comment.trim()||null})}>{busy?'در حال ثبت…':'ثبت مسیر گمرکی'}</Button></div>:<>
      {state.workflow_note&&<p className="readiness-note" role="status">{state.workflow_note} مسیر و وضعیت فعلی ذخیره شده‌اند؛ پیشروی این شاخه تا تعریف مراحل در مستندات مسدود است.</p>}
      <div className="operational-timeline-wrap"><ol className="operational-timeline" aria-label={isImport?'مراحل عملیاتی واردات':'مراحل عملیاتی صادرات'} tabIndex={0}>{isImport?<><li data-state="complete"><span className="operational-timeline-marker">✓</span><div><strong>مسیر گمرکی</strong><small>{routeNames[state.route]}</small><small className="operational-next-action"><b>دستور بعدی:</b> {importInstructions[state.history[0]?.stage]??'مرحلهٔ بعدی را طبق روال پرونده ثبت کنید.'}</small></div></li>{state.history.slice(1).map((event,index)=><li key={`${event.created_at}-${index}`} data-state="complete"><span className="operational-timeline-marker">✓</span><div><strong>{event.stage}</strong><small>انجام شده</small><small className="operational-next-action"><b>دستور بعدی:</b> {importInstructions[event.stage]??'مرحلهٔ بعدی را طبق روال پرونده ثبت کنید.'}</small></div></li>)}{nextStages.map((stage,index)=><li key={'next-'+stage} data-state="current" aria-current="step"><span className="operational-timeline-marker">{(state.history.length+index+1).toLocaleString('fa-IR')}</span><div><strong>{stage}</strong><small>{nextStages.length>1?'گزینهٔ بعدی':'مرحلهٔ جاری'}</small><small className="operational-next-action"><b>دستور بعدی:</b> {importInstructions[stage]??'شرح و مستندات این مرحله را ثبت کنید.'}</small></div></li>)}</>:<><li data-state="complete"><span className="operational-timeline-marker">✓</span><div><strong>مسیر گمرکی</strong><small>{routeNames[state.route]}</small><small className="operational-next-action"><b>دستور بعدی:</b> {state.route==='GREEN'?'ارجاع پرونده برای پرداخت حقوق و عوارض گمرکی.':'روال اجرایی این مسیر هنوز مصوب نشده است.'}</small></div></li>{state.route==='GREEN'?greenStages.map((stage,index)=>{const done=greenCompleted.includes(stage);const current=!done&&currentGreenStage===stage;return <li key={stage} data-state={done?'complete':current?'current':'pending'} aria-current={current?'step':undefined}><span className="operational-timeline-marker">{done?'✓':(index+2).toLocaleString('fa-IR')}</span><div><strong>{stage}</strong><small>{done?'انجام شده':current?'مرحلهٔ جاری':'در انتظار'}</small><small className="operational-next-action"><b>دستور بعدی:</b> {greenNextActions[index]}</small></div></li>;}):<li data-state="pending"><span className="operational-timeline-marker">۲</span><div><strong>ادامهٔ مسیر {routeNames[state.route]}</strong><small>پس از تعیین روال این مسیر فعال می‌شود</small><small className="operational-next-action">مراحل بعدی تا تصویب دستورالعمل اجرایی قابل ثبت نیست.</small></div></li>}</>}</ol></div>
      {nextStages.length>0&&<div className="workflow-action">{nextStages.length>1&&<label>مرحلهٔ بعدی را انتخاب کنید<select value={chosenNextStage} disabled={busy} onChange={event=>setNextStageChoice(event.target.value)}>{nextStages.map(stage=><option key={stage} value={stage}>{stage}</option>)}</select></label>}<label>توضیح یا یادداشت مرحله<textarea maxLength={2000} value={comment} disabled={busy} onChange={event=>setComment(event.target.value)} placeholder="شرح کوتاه اقدام انجام‌شده؛ برای درخواست مدرک، نوع مدرک را بنویسید"/></label><Button disabled={busy} onClick={()=>transition.mutate({stage:chosenNextStage,comment:comment.trim()||null})}>{busy?'در حال ثبت…':chosenNextStage}</Button></div>}
      {!nextStages.length&&!state.workflow_note&&['تحویل و تسویه ثبت شد','پرونده تکمیل شد'].includes(state.stage??'')&&<p className="save-notice">پرونده تکمیل شده و بسته است.</p>}
    </>}
    <details className="workflow-history"><summary>سابقهٔ ثبت اقدامات ({state.history.length.toLocaleString('fa-IR')})</summary><ol className="workflow-timeline" aria-label="تاریخچهٔ گردش کار">{state.history.map((event,index)=><li key={`${event.created_at}-${index}`}><span className="workflow-marker"/><div><strong>{event.stage}</strong><small>{new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(event.created_at))}</small>{event.comment&&<p>{event.comment}</p>}</div></li>)}</ol></details>
  </section>;
}
