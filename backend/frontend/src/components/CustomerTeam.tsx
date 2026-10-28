import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {prepareWriteSession,request} from '../api';
import {Button} from './Button';

type Member={id:string;user_id:string;role:string;permission_profile:string;scope_type:string;status:string;full_name:string;email:string|null};
type Invitation={id:string;email:string;role:string;purpose:string;status:string;expires_at:string};

const roleLabel:Record<string,string>={customer_manager:'مدیر شرکت',customer_employee:'کارمند شرکت'};
const invitationLabel:Record<string,string>={pending:'در انتظار فعال‌سازی',accepted:'فعال‌شده',delivery_failed:'ارسال ناموفق',revoked:'لغوشده'};

export function CustomerTeamPage({organizationId}:{organizationId:string|null}){
  const [email,setEmail]=useState('');
  const [reason,setReason]=useState('دعوت کارمند شرکت به پنل مشتری');
  const cache=useQueryClient();
  const enabled=!!organizationId;
  const base='organizations/'+encodeURIComponent(organizationId||'');
  const members=useQuery({queryKey:['customer-team',organizationId,'members'],queryFn:()=>request<Member[]>(base+'/memberships'),enabled});
  const invitations=useQuery({queryKey:['customer-team',organizationId,'invitations'],queryFn:()=>request<Invitation[]>(base+'/invitations'),enabled});
  const invite=useMutation({retry:false,mutationFn:async()=>request<{status:string;email:string;duplicate:boolean}>(base+'/invitations',{
    method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},
    body:JSON.stringify({email:email.trim(),reason:reason.trim()}),
  }),onSuccess:async()=>{setEmail('');await Promise.all([cache.invalidateQueries({queryKey:['customer-team',organizationId,'members']}),cache.invalidateQueries({queryKey:['customer-team',organizationId,'invitations']})]);}});
  return <>
    <div className="page-heading"><div><p className="eyebrow">مدیریت سازمان مشتری</p><h1>کارمندان شرکت</h1><p>کارمندها را با ایمیل دعوت کنید؛ هر حساب فقط به اطلاعات همین شرکت دسترسی دارد.</p></div></div>
    <section className="surface draft-editor">
      <h2>دعوت کارمند جدید</h2>
      <form onSubmit={event=>{event.preventDefault();invite.mutate();}}>
        <label>ایمیل کارمند<input type="email" required maxLength={320} value={email} disabled={invite.isPending} onChange={event=>setEmail(event.target.value)}/></label>
        <label>دلیل دعوت<textarea required minLength={3} maxLength={500} rows={2} value={reason} disabled={invite.isPending} onChange={event=>setReason(event.target.value)}/></label>
        <p className="muted">لینک فعال‌سازی یک‌بارمصرف و ۲۴ساعته است. کارمند خودش رمز عبور را تعیین می‌کند.</p>
        {invite.isError&&<p role="alert">دعوت ارسال نشد. ایمیل را بررسی کنید یا اگر این ایمیل قبلاً حساب دارد، با مدیر سامانه هماهنگ کنید.</p>}
        {invite.isSuccess&&<p role="status">{invite.data.duplicate?'یک دعوت فعال برای این ایمیل وجود دارد.':`سرویس ایمیل درخواست دعوت به ${invite.data.email} را پذیرفت؛ رسیدن پیام به صندوق ورودی را بررسی کنید.`}</p>}
        <Button type="submit" disabled={invite.isPending||!organizationId||!email.includes('@')||reason.trim().length<3}>{invite.isPending?'در حال ارسال…':'ارسال دعوت کارمند'}</Button>
      </form>
    </section>
    <section className="surface draft-list">
      <h2>اعضای شرکت</h2>
      {members.isPending?<p role="status">در حال دریافت اعضا…</p>:members.isError?<p role="alert">فهرست اعضا دریافت نشد.</p>:!members.data.length?<p>هنوز عضوی ثبت نشده است.</p>:members.data.map(member=><article key={member.id}><div><strong>{member.full_name}</strong><p>{member.email||'ایمیل ثبت نشده'} · {roleLabel[member.role]||member.role} · {member.status==='ACTIVE'?'فعال':'غیرفعال'}</p></div></article>)}
    </section>
    <section className="surface draft-list">
      <h2>دعوت‌ها</h2>
      {invitations.isPending?<p role="status">در حال دریافت دعوت‌ها…</p>:invitations.isError?<p role="alert">فهرست دعوت‌ها دریافت نشد.</p>:!invitations.data.filter(item=>item.purpose==='customer_employee').length?<p>دعوت کارمندی ثبت نشده است.</p>:invitations.data.filter(item=>item.purpose==='customer_employee').map(item=><article key={item.id}><div><strong>{item.email}</strong><p>{invitationLabel[item.status]||item.status}{item.status==='pending'&&new Date(item.expires_at)<new Date()?' · مهلت دعوت تمام شده':''}</p></div></article>)}
    </section>
  </>;
}

