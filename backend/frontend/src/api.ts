export type RecordRow = {id:string;[key:string]:unknown};
export type User = {id:string;full_name:string;role:string;organization_id:string|null;membership_id:string|null;scope_type:string|null};
export class ApiError extends Error {constructor(public status:number){super(status===401?'نشست شما پایان یافته است. دوباره وارد شوید.':status===403?'برای این بخش دسترسی فعال ندارید.':'دریافت اطلاعات انجام نشد. دوباره تلاش کنید.');}}
export async function request<T>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetch('/api/v1/'+path,{...init,credentials:'same-origin',headers:{Accept:'application/json',...init.headers}});
  if(!response.ok)throw new ApiError(response.status);
  return response.status===204?undefined as T:response.json();
}
export async function logout(){
  const csrf=sessionStorage.getItem('krt_csrf');
  if(!csrf)throw new Error('برای خروج امن، صفحه ورود را در همین زبانه باز کنید و دوباره وارد شوید.');
  await request('auth/logout',{method:'POST',headers:{'X-CSRF-Token':csrf}});
  sessionStorage.removeItem('krt_csrf');
}

export async function saveCustomer(name:string,id?:string):Promise<RecordRow>{
  const normalized=name.trim();
  if(normalized.length<2||normalized.length>255)throw new Error('نام مشتری باید بین ۲ تا ۲۵۵ نویسه باشد.');
  const csrf=sessionStorage.getItem('krt_csrf');
  if(!csrf)throw new Error('برای ثبت تغییرات، در همین زبانه دوباره وارد شوید.');
  return request<RecordRow>(id?'customers/'+encodeURIComponent(id):'customers',{
    method:id?'PATCH':'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},
    body:JSON.stringify({name:normalized}),
  });
}
