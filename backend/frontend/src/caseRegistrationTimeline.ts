export type RegistrationStatus='DRAFT'|'SUBMITTED'|'REGISTERED'|'ACTIVE';
export type DeclarationStatus='uploaded'|'pending'|'approved'|'correction_required'|'superseded'|string;
export type RegistrationTimelineStage={id:string;title:string;description:string;nextAction:string;state:'complete'|'current'|'upcoming'};

const titles=[
  ['request','ارسال درخواست مشتری','اطلاعات و مدارک برای بررسی ادمین','ادمین مدارک و اطلاعات را بررسی می‌کند.'],
  ['admin-review','بررسی و ثبت اولیه','بررسی پرونده و ایجاد پروندهٔ عملیاتی','ادمین پرونده را ثبت و نسخهٔ اظهارنامه را آماده می‌کند.'],
  ['declaration','تهیهٔ سند اظهارنامه','ثبت نسخهٔ سند توسط ادمین','ادمین سند را برای بررسی در کارتابل مشتری می‌فرستد.'],
  ['send','ارسال برای مشتری','قرارگرفتن نسخه در کارتابل مشتری','مشتری سند را بررسی و تأیید یا اصلاحات را اعلام می‌کند.'],
  ['approval','تأیید مشتری','تأیید نسخه یا درخواست اصلاح','ادمین شمارهٔ کوتاژ را ثبت می‌کند تا عملیات آغاز شود.'],
  ['quota','ثبت کوتاژ و شروع','ثبت شمارهٔ کوتاژ و آغاز عملیات','کاربر داخلی مسیر گمرکی و مرحلهٔ عملیاتی بعد را ثبت می‌کند.'],
] as const;

export function registrationTimeline(status:RegistrationStatus,declarationStatus:DeclarationStatus|null):RegistrationTimelineStage[]{
  let current=0;
  if(status==='SUBMITTED')current=1;
  if(status==='REGISTERED'||status==='ACTIVE')current=2;
  if(declarationStatus==='uploaded')current=3;
  if(declarationStatus==='pending')current=4;
  if(declarationStatus==='approved')current=status==='ACTIVE'?6:5;
  if(declarationStatus==='correction_required')current=2;
  if(status==='ACTIVE')current=6;
  return titles.map(([id,title,description,nextAction],index)=>({
    id,title,
    description:id==='declaration'&&declarationStatus==='correction_required'?'مشتری اصلاح خواسته؛ نسخهٔ جدید لازم است':description,
    nextAction:status==='DRAFT'&&id==='request'?'مشتری اطلاعات و مدارک را کامل کند و درخواست را برای بررسی بفرستد.':id==='declaration'&&declarationStatus==='correction_required'?'ادمین اصلاحات را اعمال و نسخهٔ تازه را برای مشتری ارسال می‌کند.':nextAction,
    state:index<current?'complete':index===current?'current':'upcoming',
  }));
}
