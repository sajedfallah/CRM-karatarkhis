export const customerProfileFields = [
  {key:'national_id',label:'کد ملی / شناسه ملی',max:32,group:'identity',dir:'ltr'},
  {key:'registration_number',label:'شماره ثبت',max:64,group:'identity',dir:'ltr'},
  {key:'economic_code',label:'کد اقتصادی',max:32,group:'identity',dir:'ltr'},
  {key:'contact_name',label:'نام نماینده یا رابط',max:255,group:'contact',dir:'rtl'},
  {key:'phone',label:'تلفن ثابت',max:40,group:'contact',dir:'ltr',type:'tel'},
  {key:'mobile',label:'تلفن همراه',max:40,group:'contact',dir:'ltr',type:'tel'},
  {key:'email',label:'ایمیل مدیر شرکت (برای ورود به پنل)',max:320,group:'contact',dir:'ltr',type:'email'},
  {key:'province',label:'استان',max:100,group:'address',dir:'rtl'},
  {key:'city',label:'شهر',max:100,group:'address',dir:'rtl'},
  {key:'postal_code',label:'کد پستی',max:20,group:'address',dir:'ltr'},
  {key:'address',label:'نشانی',max:2000,group:'address',dir:'rtl'},
] as const;
export type CustomerInput = {name:string}&Partial<Record<typeof customerProfileFields[number]['key']|'customer_type',string|null>>;

