import {useRef,useState,type FormEvent} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {ApiError} from '../api';
import {requiredImportDocuments,uploadDraftImportDocument,type CaseDraft,type DraftImportDocumentState,type ImportDocumentType} from '../drafts';
import {Button} from './Button';

const MAX_FILE_BYTES=3*1024*1024;

export function DraftImportDocuments({record,disabled,onChanged,onReload}:{record:CaseDraft;disabled:boolean;onChanged:(state:DraftImportDocumentState)=>void;onReload:()=>void}){
  const input=useRef<HTMLInputElement>(null);const [documentType,setDocumentType]=useState<ImportDocumentType|''>('');const [uploadId,setUploadId]=useState(()=>crypto.randomUUID());const [notice,setNotice]=useState('');const cache=useQueryClient();
  const upload=useMutation({retry:false,mutationFn:async()=>{
    const file=input.current?.files?.[0];
    if(!file||!file.size||file.size>MAX_FILE_BYTES)throw new Error('یک فایل PDF، PNG یا JPEG با حجم حداکثر ۳ مگابایت انتخاب کنید.');
    if(!documentType)throw new Error('نوع سند را انتخاب کنید.');
    if(!['application/pdf','image/png','image/jpeg'].includes(file.type))throw new Error('نوع فایل پشتیبانی نمی‌شود.');
    return uploadDraftImportDocument(record.id,record.version,file,documentType,uploadId);
  },onSuccess:async data=>{onChanged(data);setUploadId(crypto.randomUUID());if(input.current)input.current.value='';setNotice('سند به نسخهٔ تازهٔ پیش‌نویس افزوده شد.');await cache.invalidateQueries({queryKey:['case-drafts']});await cache.invalidateQueries({queryKey:['registration-readiness',record.id]});}});
  const conflict=upload.error instanceof ApiError&&upload.error.status===409;
  function submit(event:FormEvent){event.preventDefault();if(!upload.isPending)upload.mutate();}
  const documents=record.content.import_documents??[];
  const uploadedTypes=new Set(documents.map(item=>item.document_type).filter((type):type is ImportDocumentType=>!!type));
  return <section className="surface draft-editor"><h2>اسناد واردات</h2><p className="muted">برای تکمیل اطلاعات اولیه، هر ۱۰ سند زیر باید بارگذاری شود. PDF، PNG و JPEG تا ۳ مگابایت پشتیبانی می‌شوند.</p>
    <ul className="readiness-list">{requiredImportDocuments.map(required=>{const versions=documents.filter(item=>item.document_type===required.type);return <li key={required.type}><span>{required.label}{versions.length>1?` · ${versions.length.toLocaleString('fa-IR')} نسخه`:''}</span><span className={'status-badge '+(uploadedTypes.has(required.type)?'readiness-complete':'readiness-missing')}>{uploadedTypes.has(required.type)?'بارگذاری شده':'نیازمند بارگذاری'}</span></li>;})}</ul>
    {documents.length?<><h3 className="readiness-title">فایل‌های بارگذاری‌شده</h3><ul className="readiness-list">{documents.map(item=><li key={item.id}><span>{item.document_type?requiredImportDocuments.find(required=>required.type===item.document_type)?.label:item.title} · {item.file_name} · {(item.size_bytes/1024).toLocaleString('fa-IR',{maximumFractionDigits:0})} کیلوبایت</span><a className="record-link" href={'/api/v1/case-drafts/'+encodeURIComponent(record.id)+'/import-documents/'+encodeURIComponent(item.id)+'/file'} download>دریافت فایل</a></li>)}</ul></>:<p>هنوز مدرکی برای این پرونده بارگذاری نشده است.</p>}
    <form className="document-upload" onSubmit={submit}><label>نوع سند<select required value={documentType} disabled={disabled||upload.isPending} onChange={event=>setDocumentType(event.target.value as ImportDocumentType|'' )}><option value="">انتخاب کنید</option>{requiredImportDocuments.map(item=><option key={item.type} value={item.type}>{item.label}</option>)}</select></label><label>فایل سند<input ref={input} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required disabled={disabled||upload.isPending} onChange={()=>{setUploadId(crypto.randomUUID());upload.reset();setNotice('');}}/></label><div className="form-actions"><Button type="submit" disabled={disabled||upload.isPending}>{upload.isPending?'در حال بارگذاری…':'بارگذاری سند'}</Button></div></form>
    {notice&&<p role="status">{notice}</p>}{upload.error&&<div className="form-error" role="alert"><p>{conflict?'نسخهٔ پیش‌نویس تغییر کرده است؛ ابتدا نسخهٔ تازه را دریافت کنید.':upload.error.message||'بارگذاری سند انجام نشد.'}</p>{conflict&&<Button type="button" variant="outline" onClick={onReload}>دریافت نسخهٔ تازه</Button>}</div>}
    <p className="readiness-note">فایل‌ها خصوصی ذخیره می‌شوند و پس از بارگذاری قابل بازنویسی نیستند. بارگذاری دوبارهٔ یک نوع سند، نسخهٔ قبلی را نگه می‌دارد و نسخهٔ جدیدی اضافه می‌کند؛ تکمیل این فهرست، تأیید اصالت یا کفایت حقوقی نیست.</p>
  </section>;
}

