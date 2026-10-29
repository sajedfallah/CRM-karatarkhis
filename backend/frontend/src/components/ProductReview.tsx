import {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {request,prepareWriteSession,type ApiError} from '../api';
import {type CaseDraft} from '../drafts';
import {Button} from './Button';
export function ProductReview({record,unsaved,onReviewed}:{record:CaseDraft;unsaved:boolean;onReviewed:(data:CaseDraft)=>void}){
  const [reason,setReason]=useState('');const [confirmed,setConfirmed]=useState(false);
  const save=useMutation({retry:false,mutationFn:async()=>request<CaseDraft>('case-drafts/'+encodeURIComponent(record.id)+'/product-review',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':await prepareWriteSession()},body:JSON.stringify({expected_version:record.version,reason:reason.trim()})}),onSuccess:data=>{setReason('');setConfirmed(false);onReviewed(data);}});
  const ready=!!record.content.product_description&&!!record.content.product_details?.technical_attributes&&!!record.content.product_details?.hs_code;
  return <section className="surface draft-editor"><h2>بررسی انسانی کالا و HS</h2>
    {unsaved?<p role="status">ابتدا تغییرات اطلاعات کالا را ذخیره کنید.</p>:record.product_review?.status==='VERIFIED'?<><p className="save-notice">بررسی انسانی برای اطلاعات فعلی ثبت شده است.</p><p>مبنای بررسی: {record.product_review.reason}</p></>:<><p>شرح کالا، ویژگی‌های فنی و کد HS ذخیره‌شده باید توسط مدیر بررسی شوند. ثبت قالب کد، صحت طبقه‌بندی را تأیید نمی‌کند.</p>{!ready&&<p className="muted">شرح کالا، ویژگی‌های فنی و کد HS را تکمیل و ذخیره کنید.</p>}<label>مبنا و دلیل بررسی<textarea maxLength={2000} value={reason} disabled={save.isPending} onChange={e=>setReason(e.target.value)}/></label><label><input type="checkbox" checked={confirmed} disabled={save.isPending} onChange={e=>setConfirmed(e.target.checked)}/>مشخصات فنی و کد همین نسخه را بررسی کرده‌ام و مسئولیت تأیید آن را می‌پذیرم.</label><Button disabled={!ready||!confirmed||reason.trim().length<3||save.isPending} onClick={()=>save.mutate()}>{save.isPending?'در حال ثبت…':'ثبت بررسی انسانی'}</Button></>}
    {save.isError&&<p role="alert" className="form-error">{(save.error as ApiError).status===409?'اطلاعات پرونده تغییر کرده است؛ نسخه تازه را دریافت و دوباره بررسی کنید.':save.error.message}</p>}
    <p className="readiness-note">تغییر اطلاعات مؤثر کالا، بررسی قبلی را برای ادامه کار بی‌اعتبار می‌کند. این تأیید جای تأیید مشتری یا ثبت نهایی پرونده را نمی‌گیرد.</p>
  </section>;
}

