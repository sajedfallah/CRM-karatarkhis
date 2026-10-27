'use strict';
const byId = id => document.getElementById(id);
const statusLine = byId('status');
const errors = {
  invalid_or_expired_invitation: 'لینک معتبر نیست، منقضی شده یا قبلاً استفاده شده است. دعوت جدید درخواست کنید.',
  existing_account_requires_sign_in: 'این ایمیل حساب دارد. از صفحه ورود استفاده کنید.',
  invalid_credentials: 'ایمیل یا رمز معتبر نیست، یا حساب هنوز فعال نشده است.',
  invalid_origin: 'آدرس این صفحه برای ورود مجاز نیست. از لینک اصلی سامانه استفاده کنید.',
  login_rate_limited: 'تعداد تلاش‌ها زیاد است. پانزده دقیقه دیگر دوباره تلاش کنید.'
};
async function api(path, body, csrf) {
  const response = await fetch(path, { method:'POST', credentials:'same-origin',
    headers:{'Content-Type':'application/json', ...(csrf ? {'X-CSRF-Token':csrf} : {})},
    body: body ? JSON.stringify(body) : undefined });
  const data = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(errors[data.detail] || 'عملیات انجام نشد. دوباره تلاش کنید.');
  return data;
}
function action(form, work) {
  form.addEventListener('submit', async event => {
    event.preventDefault(); const button=form.querySelector('button'); button.disabled=true;statusLine.textContent='در حال انجام…';
    try { await work(); } catch(error) { statusLine.textContent=error.message || 'ارتباط برقرار نشد.'; }
    finally { button.disabled=false; }
  });
}
if (location.pathname === '/activate') {
  let token = new URLSearchParams(location.hash.slice(1)).get('token');
  history.replaceState(null, '', '/activate');
  byId('title').textContent='فعال‌سازی حساب';
  byId('intro').textContent='با تعیین رمز شخصی، ایمیل خود را تأیید و حساب را فعال کنید.';
  if (!token) {statusLine.textContent='لینک کامل داخل ایمیل دعوت را باز کنید.';}
  else {byId('activate').hidden=false;}
  action(byId('activate'), async()=>{
    if (byId('new-password').value !== byId('confirm-password').value) throw new Error('رمزها یکسان نیستند.');
    await api('/api/v1/auth/accept-invitation',{token,password:byId('new-password').value,full_name:byId('full-name').value.trim()});
    token=null;byId('activate').reset();byId('activate').hidden=true;
    statusLine.textContent='ایمیل تأیید شد و حساب فعال است. اکنون وارد شوید.';byId('login-link').hidden=false;
  });
} else if (location.pathname === '/account') {
  byId('title').textContent='حساب شما';
  fetch('/api/v1/users/me',{credentials:'same-origin'}).then(async response=>{
    if(!response.ok){location.replace('/login');return;}
    const me=await response.json();byId('identity').textContent=me.full_name;byId('account').hidden=false;
    byId('intro').textContent='ورود شما موفق بود. می‌توانید پنل عملیات را باز کنید.';
  }).catch(()=>{statusLine.textContent='ارتباط برقرار نشد.';});
  byId('logout').addEventListener('click',async()=>{
    try{await api('/api/v1/auth/logout',null,sessionStorage.getItem('krt_csrf'));sessionStorage.removeItem('krt_csrf');location.replace('/login');}
    catch(error){statusLine.textContent=error.message;}
  });
} else {
  byId('title').textContent='ورود به کاراترخیص';byId('intro').textContent='با ایمیل و رمز حساب فعال‌شده وارد شوید.';byId('login').hidden=false;
  action(byId('login'),async()=>{
    const result=await api('/api/v1/auth/login',{email:byId('email').value,password:byId('password').value});
    byId('login').reset();sessionStorage.setItem('krt_csrf',result.csrf_token);location.assign('/app');
  });
}
