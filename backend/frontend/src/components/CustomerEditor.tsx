import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {X} from 'lucide-react';
import {saveCustomer,prepareWriteSession,type RecordRow} from '../api';
import {Button} from './Button';

export function CustomerEditor({record,onClose,onSaved}:{record:RecordRow|null;onClose:()=>void;onSaved:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [name,setName]=useState(String(record?.name??''));
  const cache=useQueryClient();
  const session=useQuery({queryKey:['write-session'],queryFn:prepareWriteSession,retry:false});
  const save=useMutation({mutationFn:()=>saveCustomer(name,record?.id),retry:false,
    onSuccess:async()=>{
      await cache.invalidateQueries({queryKey:['records']});
      onSaved();
    }});
  useEffect(()=>{dialog.current?.showModal();},[]);
  function submit(event:FormEvent){event.preventDefault();if(!save.isPending)save.mutate();}
  return <dialog ref={dialog} className="detail-dialog customer-editor" aria-labelledby="customer-editor-title"
    onCancel={event=>{if(save.isPending)event.preventDefault();else onClose();}}>
    <header><h2 id="customer-editor-title">{record?'اصلاح نام مشتری':'ثبت مشتری جدید'}</h2>
      <Button variant="ghost" size="icon" aria-label="بستن فرم" disabled={save.isPending} onClick={onClose}><X size={20}/></Button></header>
    <form onSubmit={submit}>
      <p className="muted">نام شرکت یا صاحب کالا را وارد کنید.</p>
      <label htmlFor="customer-name">نام مشتری <span aria-hidden="true">*</span></label>
      <input id="customer-name" name="name" autoFocus required minLength={2} maxLength={255}
        value={name} onChange={event=>setName(event.target.value)} disabled={save.isPending} aria-describedby="customer-name-help"/>
      <small id="customer-name-help">بین ۲ تا ۲۵۵ نویسه</small>
      {session.isPending&&<p role="status">در حال بررسی نشست…</p>}
      {session.isError&&<div role="alert"><p className="form-error">{session.error.message}</p><Button type="button" variant="outline" onClick={()=>void session.refetch()}>بررسی دوباره نشست</Button></div>}
      {save.isError&&<p role="alert" className="form-error">{save.error.message}</p>}
      <div className="form-actions"><Button type="submit" disabled={save.isPending||session.isPending||session.isError||name.trim().length<2}>
        {save.isPending?'در حال ذخیره…':record?'ذخیره نام مشتری':'ثبت مشتری'}</Button>
        <Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>انصراف</Button></div>
    </form>
  </dialog>;
}
