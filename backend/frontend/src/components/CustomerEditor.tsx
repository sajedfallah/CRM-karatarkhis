import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {X} from 'lucide-react';
import {saveCustomer,prepareWriteSession,type RecordRow} from '../api';
import {Button} from './Button';
import {customerProfileFields,type CustomerInput} from '../customerProfile';

export function CustomerEditor({record,onClose,onSaved}:{record:RecordRow|null;onClose:()=>void;onSaved:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(['name','customer_type',...customerProfileFields.map(f=>f.key)].map(key=>[key,String(record?.[key]??'')])));
  const name=values.name;
  const change=(key:string,value:string)=>setValues(previous=>({...previous,[key]:value}));
  const cache=useQueryClient();
  const session=useQuery({queryKey:['write-session'],queryFn:prepareWriteSession,retry:false});
  const save=useMutation({mutationFn:()=>saveCustomer(values as CustomerInput,record?.id),retry:false,
    onSuccess:async()=>{
      await cache.invalidateQueries({queryKey:['records']});
      onSaved();
    }});
  useEffect(()=>{dialog.current?.showModal();},[]);
  function submit(event:FormEvent){event.preventDefault();if(!save.isPending)save.mutate();}
  return <dialog ref={dialog} className="detail-dialog customer-editor" aria-labelledby="customer-editor-title"
    onCancel={event=>{if(save.isPending)event.preventDefault();else onClose();}}>
    <header><h2 id="customer-editor-title">{record?'ویرایش اطلاعات مشتری':'ثبت مشتری جدید'}</h2>
      <Button variant="ghost" size="icon" aria-label="بستن فرم" disabled={save.isPending} onClick={onClose}><X size={20}/></Button></header>
    <form onSubmit={submit}>
      <p className="muted">مشخصات مشتری را وارد کنید. فقط نام مشتری الزامی است.</p>
      <label htmlFor="customer-name">نام مشتری <span aria-hidden="true">*</span></label>
      <input id="customer-name" name="name" autoFocus required minLength={2} maxLength={255}
        value={name} onChange={event=>change('name',event.target.value)} disabled={save.isPending} aria-describedby="customer-name-help"/>
      <small id="customer-name-help">بین ۲ تا ۲۵۵ نویسه</small>
      <div className="customer-grid"><div><label htmlFor="customer-type">نوع مشتری</label>
        <select id="customer-type" value={values.customer_type} disabled={save.isPending} onChange={event=>change('customer_type',event.target.value)}>
          <option value="">مشخص نشده</option value="company">حقوقی (شرکت)</option><option value="person">حقیقی (شخص)</option>
        </select></div></div>
      {([{key:'identity',title:'مشخصات هویتی و ثبتی'},{key:'contact',title:'اطلاعات تماس'},{key:'address',title:'نشانی'}] as const).map(group=><fieldset key={group.key}>
        <legend>{group.title}</legend><div className="customer-grid">{customerProfileFields.filter(field=>field.group===group.key).map(field=><div key={field.key} className={field.key==='address'?'full-width':''}>
          <label htmlFor={'customer-'+field.key}>{field.label}</label>
          {field.key==='address'?<textarea id={'customer-'+field.key} value={values[field.key]} maxLength={field.max} disabled={save.isPending} rows={3} onChange={event=>change(field.key,event.target.value)}/>:
          <input id={'customer-'+field.key} name={field.key} type={'type' in field?field.type:'text'} dir={field.dir} maxLength={field.max} value={values[field.key]} disabled={save.isPending} onChange={event=>change(field.key,event.target.value)}/>}
        </div>)}</div></fieldset>)}
      {session.isPending&&<p role="status">در حال بررسی نشست…</p>}
      {session.isError&&<div role="alert"><p className="form-error">{session.error.message}</p><Button type="button" variant="outline" onClick={()=>void session.refetch()}>بررسی دوباره نشست</Button></div>}
      {save.isError&&<p role="alert" className="form-error">{save.error.message}</p>}
      <div className="form-actions"><Button type="submit" disabled={save.isPending||session.isPending||session.isError||name.trim().length<2}>
        {save.isPending?'در حال ذخیره…':record?'ذخیره اطلاعات مشتری':'ثبت مشتری'}</Button>
        <Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>انصراف</Button></div>
    </form>
  </dialog>;
}
