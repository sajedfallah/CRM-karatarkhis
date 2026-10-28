import {useRef,useState,type FormEvent} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {ApiError} from '../api';
import {uploadDraftImportDocument,type CaseDraft,type DraftImportDocumentState} from '../drafts';
import {Button} from './Button';

const MAX_FILE_BYTES=3*1024*1024;

export function DraftImportDocuments({record,disabled,onChanged,onReload}:{record:CaseDraft;disabled:boolean;onChanged:(state:DraftImportDocumentState)=>void;onReload:()=>void}){
  const input=useRef<HTMLInputElement>(null);const [title,setTitle]=useState('');const [uploadId,setUploadId]=useState(()=>crypto.randomUUID());const [notice,setNotice]=useState('');const cache=useQueryClient();
  const upload=useMutation({retry:false,mutationFn:async()=>{
    const file=input.current?.files?.[0];
    if(!file||!file.size||file.size>MAX_FILE_BYTES)throw new Error('یک فایل PDF، PNG یا JPEG با حجم حداکثر ۳ مگابایت انتخاب کنید.');
    if(!title.trim())throw new Error('عنوان مدرک را وارد کنید.');
    if(!['application/pdf','image/png','image/jpeg'].includes(file.type))throw new Error('نوع فایل پشتیبانی نمی‌شود.');
    return uploadDraftImportDocument(record.id,record.version,file,title.trim(),uploadId);
  },onSuccess:async data=>{onChanged(data);setTitle('');setUploadId(crypto.randomUUID());if(input.current)input.current.value='';setNotice('مدرک به نسخهٔ جدید پیش‌نویس افزوده شد.');await cache.invalidateQueries({queryKey:['case-drafts']});await cache.invalidateQueries({queryKey:['registration-readiness',record.id]});}});
  const conflict=upload.error instanceof ApiError&&upload.error.status===409;
  function submit(event:FormEvent){event.preventDefault();if(!upload.isPending)upload.mutate();}
  const documents=record.content.import_documents??[];
  return <section className="surface draft-editor"><h2>اسناد واردات</h2><p className="muted">اسناد مربوط به همین پیش‌نویس را بارگذاری کنید. نام نوع سند را مشخص کنید؛ فهرست اجباریِ نوع اسناد هنوز تعریف نشده است. PDF، PNG و JPEG تا ۳ مگابایت پشتیبانی می‌شوند.</p>
    {documents.length?<ul className="readiness-list">{documents.map(item=><li key={item.id}><span>{item.title} · {item.file_name} · {(item.size_bytes/1024).toLocaleString('fa-IR',{maximumFractionDigits:0})} کیلوبایت</span><a className="record-link" href={'/api/v1/case-drafts/'+encodeURIComponent(record.id)+'/import-documents/'+encodeURIComponent(item.id)+'/file'} download>دریافت فایل</a></li>)}</ul>:<p>هنوز مدرکی برای این پرونده بارگذاری نشده است.</p>}
    <form className="document-upload" onSubmit={submit}><label>عنوان مدرک<input required maxLength={120} value={title} disabled={disabled||upload.isPending} onChange={event=>setTitle(event.target.value)}/></label><label>فایل مدرک<input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required disabled={disabled||upload.isPending} onChange={()=>{setUploadId(crypto.randomUUID());upload.reset();setNotice('');}}/></label><div className="form-actions"><Button type="submit" disabled={disabled||upload.isPending}>{upload.isPending?'در حال بارگذاری…':'بارگذاری مدرک'}</Button></div></form>
    {notice&&<p role="status">{notice}</p>}{upload.error&&<div className="form-error" role="alert"><p>{conflict?'نسخهٔ پیش‌نویس تغییر کرده است؛ ابتدا نسخهٔ تازه را دریافت کنید.':upload.error.message||'بارگذاری مدرک انجام نشد.'}</p>{conflict&&<Button type="button" variant="outline" onClick={onReload}>دریافت نسخهٔ تازه</Button>}</div>}
    <p className="readiness-note">فایل‌ها خصوصی ذخیره می‌شوند، هش آن‌ها کنترل می‌شود و پس از بارگذاری قابل بازنویسی نیستند. برای شروع، حداقل یک مدرک لازم است.</p>
  </section>;
}
