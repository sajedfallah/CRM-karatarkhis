import {customerProfileFields,type CustomerInput} from './customerProfile';
export type RecordRow = {id:string;[key:string]:unknown};
export type User = {id:string;full_name:string;role:string;organization_id:string|null;membership_id:string|null;scope_type:string|null};
export class ApiError extends Error {constructor(public status:number){super(status===401?'نشست شما پایان یافته است. دوباره وارد شوید.':status===403?'برای این بخش دسترسی فعال ندارید.':'دریافت اطلاعات انجام نشد. دوباره تلاش کنید.');}}
export async function request<T>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetch('/api/v1/'+path,{...init,credentials:'same-origin',headers:{Accept:'application/json',...init.headers}});
  if(!response.ok)throw new ApiError(response.status);
  return response.status===204?undefined as T:response.json();
}
export async function logout(){
  const csrf=await prepareWriteSession();
  await request('auth/logout',{method:'POST',headers:{'X-CSRF-Token':csrf}});
  sessionStorage.removeItem('krt_csrf');
}

export async function prepareWriteSession():Promise<string>{
  const stored=sessionStorage.getItem('krt_csrf');
  if(stored)return stored;
  const data=await request<{csrf_token:string}>('auth/csrf',{headers:{'X-CSRF-Request':'1'}});
  if(!data?.csrf_token)throw new Error('نشست شما معتبر نیست. دوباره وارد شوید.');
  sessionStorage.setItem('krt_csrf',data.csrf_token);
  return data.csrf_token;
}

export async function saveCustomer(input:string|CustomerInput,id?:string):Promise<RecordRow>{
  const normalized=(typeof input==='string'?input:input.name).trim();
  const payload:CustomerInput={name:normalized};
  if(typeof input!=='string'){
    for(const key of ['customer_type',...customerProfileFields.map(field=>field.key)] as const){
      if(key in input)payload[key]=input[key]?.trim()||null;
    }
  }
  if(normalized.length<2||normalized.length>255)throw new Error('نام مشتری باید بین ۲ تا ۲۵۵ نویسه باشد.');
  const csrf=await prepareWriteSession();
  return request<RecordRow>(id?'customers/'+encodeURIComponent(id):'customers',{
    method:id?'PATCH':'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
    body:JSON.stringify(payload),
  });
}
