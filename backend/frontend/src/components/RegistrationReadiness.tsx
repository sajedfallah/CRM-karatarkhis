import {useQuery} from '@tanstack/react-query';
import {request} from '../api';
import {Button} from './Button';
type Readiness={draft_version:number;initial_data_complete:boolean;final_submission_available:false;initial_checks:{id:string;title:string;complete:boolean}[];workflow_gaps:{requirement:string;title:string;status:string}[];corporate_documents:{id:string;title:string;version:number;status:string}[]};
const validity:Record<string,string>={VALID:'دارای اعتبار زمانی',EXPIRING_SOON:'نزدیک انقضا',EXPIRED:'منقضی‌شده',NOT_YET_VALID:'اعتبار هنوز آغاز نشده',UNKNOWN_EXPIRY:'انقضای نامشخص'};
export function RegistrationReadiness({id,version,unsaved,onReload}:{id:string;version:number;unsaved:boolean;onReload:()=>void}){
  const query=useQuery({queryKey:['registration-readiness',id,version],queryFn:()=>request<Readiness>('case-drafts/'+encodeURIComponent(id)+'/readiness?expected_version='+version),enabled:!unsaved,refetchOnWindowFocus:false});
  return <section className="surface draft-editor"><h2>مراحل تکمیل و ثبت نهایی پرونده</h2><p className="muted">این بررسی فقط اطلاعات ذخیره‌شده را می‌خواند و پرونده نهایی ایجاد نمی‌کند.</p>
    {unsaved?<p role="status">پس از ذخیره تغییرات، وضعیت همین نسخه بررسی می‌شود.</p>:query.isPending?<p role="status">در حال بررسی اطلاعات ذخیره‌شده…</p>:query.isError?<div role="alert"><p>بررسی انجام نشد؛ ممکن است نسخه پرونده تغییر کرده باشد.</p><Button variant="outline" onClick={onReload}>دریافت نسخه تازه پرونده</Button></div>:<>
      <h3 className="readiness-title">اطلاعات اولیه · نسخه {query.data.draft_version.toLocaleString('fa-IR')}</h3><ul className="readiness-list">{query.data.initial_checks.map(item=><li key={item.id}><span>{item.title}</span><span className={'status-badge '+(item.complete?'readiness-complete':'readiness-missing')}>{item.complete?'ثبت شده':'نیازمند تکمیل'}</span></li>)}</ul>
      <p className="readiness-note">{query.data.initial_data_complete?'اطلاعات اولیه ثبت شده است. مراحل زیر همچنان برای ثبت نهایی باقی مانده‌اند.':'ابتدا اطلاعات اولیه را تکمیل کنید. مراحل زیر نیز برای ثبت نهایی باقی مانده‌اند.'}</p>
      <h3 className="readiness-title">مراحل سامانه که هنوز پیاده‌سازی نشده‌اند</h3><ul className="readiness-list">{query.data.workflow_gaps.map(item=><li key={item.requirement}><span>{item.title}</span><span className="status-badge">در انتظار پیاده‌سازی</span></li>)}</ul>
      <h3 className="readiness-title">اعتبار زمانی مدارک مشتری</h3>{!query.data.corporate_documents.length?<p>هنوز مجوز یا وکالت‌نامه‌ای برای این مشتری بارگذاری نشده است.</p>:<ul className="readiness-list">{query.data.corporate_documents.map(document=><li key={document.id}><span>{document.title} · نسخه {document.version.toLocaleString('fa-IR')}</span><span className="status-badge">{validity[document.status]||document.status}</span></li>)}</ul>}
      <p className="readiness-note">این مدارک هنوز به نسخه اطلاعات پرونده متصل نشده‌اند. اعتبار زمانی مدرک، تأیید الزامات این پرونده محسوب نمی‌شود. تأیید پیش‌نویس اظهارنامه نیز جای تأیید ثبت نهایی پرونده را نمی‌گیرد.</p>
    </>}
  </section>;
}

