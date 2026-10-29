import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,prepareWriteSession} from '../api';
import {Button} from './Button';
export type AppNotification={id:string;kind:'corporate_document'|'case_workflow';title:string;customer_id?:string;document_title?:string;customer_name?:string;case_id?:string;case_title?:string;body?:string;read_at:string|null;created_at:string;threshold?:number};
export function Notifications(){
  const cache=useQueryClient();
  const query=useQuery({queryKey:['notifications'],queryFn:()=>request<AppNotification[]>('notifications')});
  const read=useMutation({mutationFn:async(id:string)=>request('notifications/'+encodeURIComponent(id)+'/read',{method:'PATCH',headers:{'X-CSRF-Token':await prepareWriteSession()}}),onSuccess:()=>cache.invalidateQueries({queryKey:['notifications']})});
  return <><div className="page-heading"><div><h1>اعلان‌ها</h1><p>پیام‌های پرونده و هشدار مدارک مشتریان</p></div></div><section className="surface notification-list">
    {query.isPending?<p role="status">در حال دریافت اعلان‌ها…</p>:query.isError?<p role="alert">دریافت اعلان‌ها انجام نشد.</p>:!query.data.length?<p>اعلان فعالی ندارید.</p>:query.data.map(row=><article key={row.id} className={row.read_at?'notification-item':'notification-item unread'}><h2>{row.title}</h2><p>{row.kind==='case_workflow'?`${row.case_title||'پرونده'} · ${row.body||'پیام جدید'}`:`${row.customer_name} · ${row.document_title}`}</p>
      <a href={row.kind==='case_workflow'?'/app/cases?case='+encodeURIComponent(row.case_id||''):'/app/customers?customer='+encodeURIComponent(row.customer_id||'')+'&tab=documents'}>{row.kind==='case_workflow'?'مشاهدهٔ پرونده':'مشاهده مدارک مشتری'}</a>
      {!row.read_at&&<Button variant="outline" disabled={read.isPending} onClick={()=>read.mutate(row.id)}>خوانده شد</Button>}</article>)}
    {read.isError&&<p role="alert">ثبت وضعیت اعلان انجام نشد.</p>}</section></>;
}
