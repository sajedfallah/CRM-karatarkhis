import {useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {prepareWriteSession,request,ApiError} from '../api';
import {Button} from './Button';
type Invitation={id:string;email:string;status:string;expires_at:string};
const statuses:Record<string,string>={pending:'در انتظار فعال‌سازی',accepted:'فعال‌شده',delivery_failed:'ارسال ناموفق',revoked:'لغوشده'};
export function CustomerReviewer({customerId}:{customerId:string}){
  const [email,setEmail]=useState('');const [reason,setReason]=useState('');const [confirmed,setConfirmed]=useState(false);const [notice,setNotice]=useState('');const cache=useQueryClient();
  const path='customers/'+encodeURIComponent(customerId)+'/reviewer-invitations';
  const query=useQuery({queryKey:['reviewer-invitations',customerId],queryFn:()=>request<Invitation[]>(path)});
  const save=useMutation({retry:false,mutationFn:async()=>{const csrf=await prepareWriteSession();return request(path,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({email:email.trim(),reason:reason.trim()})});},onSuccess:async()=>{setEmail('');setReason('');setConfirmed(false);setNotice('دعوت در سرویس ایمیل پذیرفته شد؛ فعال‌سازی با لینک ایمیل انجام می‌شود.');await cache.invalidateQueries({queryKey:['reviewer-invitations',customerId]});},onError:()=>void cache.invalidateQueries({queryKey:['reviewer-invitations',customerId]})});
  function submit(event:FormEvent){event.preventDefault();if(confirmed&&!save.isPending)save.mutate();}
  return <section className="customer-documents"><h3>دسترسی بررسی اسناد مشتری</h3><p>این حساب فقط پیش‌نویس‌های اظهارنامه ارسال‌شده برای خودش را دریافت و تأیید می‌کند یا درخواست اصلاح می‌دهد. دسترسی عمومی به اطلاعات داخلی و مدیریت کاربران ندارد.</p>
    <form className="document-upload" onSubmit={submit}><label>ایمیل بررسی‌کننده<input type="email" required maxLength={320} value={email} disabled={save.isPending} onChange={e=>setEmail(e.target.value)}/></label><label>دلیل اعطای دسترسی<textarea required minLength={3} maxLength={500} value={reason} disabled={save.isPending} onChange={e=>setReason(e.target.value)}/></label><label><input type="checkbox" checked={confirmed} disabled={save.isPending} onChange={e=>setConfirmed(e.target.checked)}/>ایمیل و دسترسی بررسی اسناد این مشتری را تأیید می‌کنم.</label><p className="muted">لینک یک‌بارمصرف ۲۴ ساعته است. ارسال به ایمیل‌های دیگر به تنظیم فرستنده تأییدشده نیاز دارد. حساب موجود فعلاً با این فرم دعوت نمی‌شود.</p>
    {save.isError&&<p role="alert" className="form-error">{save.error instanceof ApiError&&save.error.status===409?'این ایمیل ممکن است حساب فعال داشته باشد یا وضعیت مشتری تغییر کرده باشد.':save.error instanceof ApiError&&save.error.status===502?'سرویس ایمیل ارسال دعوت را نپذیرفت؛ تنظیم فرستنده و محدودیت گیرنده را بررسی کنید.':save.error.message}</p>}
    {notice&&<p role="status" className="save-notice">{notice}</p>}<Button type="submit" disabled={save.isPending||!confirmed||reason.trim().length<3}>{save.isPending?'در حال ارسال…':'ارسال دعوت بررسی اسناد'}</Button></form>
    {query.isPending?<p role="status">در حال دریافت دعوت‌ها…</p>:query.isError?<p role="alert">دریافت دعوت‌ها انجام نشد.</p>:query.data.map(row=><article key={row.id} className="document-version"><strong>{row.email}</strong><p>{statuses[row.status]||row.status}{row.status==='pending'&&new Date(row.expires_at)<new Date()?' · مهلت فعال‌سازی پایان یافته':''}</p></article>)}
  </section>;
}

