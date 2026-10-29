import {useQuery} from '@tanstack/react-query';
import {request} from '../api';
import {registrationTimeline,type DeclarationStatus,type RegistrationStatus} from '../caseRegistrationTimeline';

type DeclarationVersion={status:DeclarationStatus;version:number};
export function CaseRegistrationTimeline({requestId,status,caseId}:{requestId:string;status:RegistrationStatus;caseId:string|null}){
  const versions=useQuery({queryKey:['declarations',caseId],queryFn:()=>request<DeclarationVersion[]>('declarations/cases/'+encodeURIComponent(caseId!)),enabled:!!caseId,refetchInterval:caseId?30000:false});
  const latestStatus=versions.data?.[0]?.status??null;
  const stages=registrationTimeline(status,latestStatus);
  return <section className="case-registration-timeline" aria-labelledby={`registration-timeline-${requestId}`}>
    <div className="case-registration-timeline-heading"><div><h3 id={`registration-timeline-${requestId}`}>روند ثبت و صدور اسناد</h3><p>از ارسال درخواست تا شروع پرونده</p></div>{versions.isFetching&&caseId&&<small role="status">به‌روزرسانی وضعیت…</small>}</div>
    <ol className="case-registration-steps" aria-label="مراحل ثبت پرونده و اظهارنامه" tabIndex={0}>
      {stages.map((stage,index)=><li key={stage.id} data-state={stage.state} aria-current={stage.state==='current'?'step':undefined}>
        <div className="case-registration-step-rail"><span className="case-registration-step-marker">{stage.state==='complete'?'✓':(index+1).toLocaleString('fa-IR')}</span>{index<stages.length-1&&<span className="case-registration-step-connector"/>}</div>
        <div className="case-registration-step-copy"><strong>{stage.title}</strong><small>{stage.description}</small><small className="case-registration-next-action"><b>گام بعد:</b> {stage.nextAction}</small></div>
      </li>)}
    </ol>
    {versions.isError&&caseId&&<p className="case-registration-timeline-note" role="status">وضعیت نسخهٔ اظهارنامه دریافت نشد؛ اطلاعات پرونده همچنان قابل مشاهده است.</p>}
    {latestStatus==='correction_required'&&<p className="case-registration-timeline-note" role="status">درخواست اصلاح مشتری ثبت شده است؛ پس از بارگذاری نسخهٔ جدید، سند دوباره برای تأیید ارسال می‌شود.</p>}
  </section>;
}
