import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {prepareWriteSession,request} from '../api';
import {Button} from './Button';

export function CustomerManagerAccess({customerId,email}:{customerId:string;email:string|null}){
  const cache=useQueryClient();
  const invitations=useQuery({queryKey:['manager-invitations',customerId],queryFn:()=>request<{id:string;email:string;purpose:string;status:string;expires_at:string}[]>(
    'customers/'+encodeURIComponent(customerId)+'/reviewer-invitations'),
  });
  const invite=useMutation({retry:false,mutationFn:async()=>request<{status:string;email:string;duplicate:boolean}>(
    'customers/'+encodeURIComponent(customerId)+'/manager-invitation',
    {method:'POST',headers:{'X-CSRF-Token':await prepareWriteSession()}},
  ),onSuccess:async()=>{await Promise.all([cache.invalidateQueries({queryKey:['manager-invitations',customerId]}),cache.invalidateQueries({queryKey:['reviewer-invitations',customerId]})]);}});
  const latest=invitations.data?.find(item=>item.purpose==='customer_manager');
  return <section className="customer-documents">
    <h3>مدیر پنل مشتری</h3>
    <p>این ایمیل به حساب مدیر شرکت متصل است؛ مدیر پس از فعال‌سازی می‌تواند کارمندهای همان شرکت را دعوت کند.</p>
    <p><bdi dir="ltr">{email||'ایمیل مدیر ثبت نشده است'}</bdi></p>
    {invitations.isPending?<p role="status">در حال بررسی وضعیت دعوت…</p>:latest&&<p>وضعیت دعوت: {latest.status==='accepted'?'حساب فعال شده است':latest.status==='pending'?'در انتظار فعال‌سازی':latest.status==='delivery_failed'?'ارسال ناموفق':'لغوشده'}{latest.status==='pending'&&new Date(latest.expires_at)<new Date()?' · مهلت دعوت تمام شده':''}</p>}
    {invite.isError&&<p role="alert">دعوت ارسال نشد. اگر این ایمیل قبلاً حساب دارد یا ایمیل ارسال پیکربندی نشده، وضعیت را بررسی کنید.</p>}
    {invite.isSuccess&&<p role="status">سرویس ایمیل درخواست دعوت فعال‌سازی به {invite.data.email} را پذیرفت؛ رسیدن به صندوق ورودی را بررسی کنید.</p>}
    <Button disabled={!email||invite.isPending} onClick={()=>invite.mutate()}>{invite.isPending?'در حال ارسال…':'ارسال دوباره دعوت مدیر'}</Button>
  </section>;
}

