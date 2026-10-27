import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {request,prepareWriteSession} from '../api';
import {Button} from './Button';
export type AppNotification={id:string;title:string;customer_id:string;document_title:string;customer_name:string;read_at:string|null;created_at:string;threshold:number};
export function Notifications(){
  const cache=useQueryClient();
  const query=useQuery({queryKey:['notifications'],queryFn:()=>request<AppNotification[]>('notifications')});
  const read=useMutation({mutationFn:async(id:string)=>request('notifications/'+encodeURIComponent(id)+'/read',{method:'PATCH',headers:{'X-CSRF-Token':await prepareWriteSession()}}),onSuccess:()=>cache.invalidateQueries({queryKey:['notifications']})});
  return <><div className="page-heading"><div><h1>اعلان‌ها</h1><p>هشدارهای اعتبار مجوزها و وکالت‌نامه‌های مشتریان</p></div></div><section className="surface notification-list">
    {query.isPending?<p role="status">در حال دریافت اعلان‌ها…</p>:query.isError?<p role="alert">دریافت اعلان‌ها انجام نشد.</p>:!query.data.length?<p>اعلان فعالی ندارید.</p>:query.data.map(row=><article key={row.id} className={row.read_at?'notification-item':'notification-item unread'}><h2>{row.title}</h2><p>{row.customer_name} · {row.document_title}</p>
      <a href={'/app/customers?customer='+encodeURIComponent(row.customer_id)+'&tab=documents'}>مشاهده مدارک مشتری</a>
      {!row.read_at&&<Button variant="outline" disabled={read.isPending} onClick={()=>read.mutate(row.id)}>خوانده شد</Button>}</article>)}
    {read.isError&&<p role="alert">ثبت وضعیت اعلان انجام نشد.</p>}</section></>;
}
