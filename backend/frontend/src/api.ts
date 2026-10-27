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
