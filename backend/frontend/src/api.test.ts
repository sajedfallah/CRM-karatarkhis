import {afterEach,expect,test,vi} from 'vitest';
import {request,logout,saveCustomer,ApiError} from './api';
afterEach(()=>vi.unstubAllGlobals());

test('customer writes require csrf before any network request',async()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=>null});const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  await expect(saveCustomer('Customer')).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
test('customer save trims input and transmits only the editable name',async()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=> 'test-csrf'});
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:'CUS-1',name:'Customer'}),{status:201}));vi.stubGlobal('fetch',fetch);
  await saveCustomer(' Customer ');
  expect(fetch).toHaveBeenCalledWith('/api/v1/customers',expect.objectContaining({method:'POST',credentials:'same-origin',body:JSON.stringify({name:'Customer'}),headers:expect.objectContaining({'X-CSRF-Token':'test-csrf','Content-Type':'application/json'})}));
});
test('customer rename uses patch and rejects whitespace-only names without sending',async()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=> 'test-csrf'});
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:'CUS-1'}),{status:200}));vi.stubGlobal('fetch',fetch);
  await saveCustomer('Customer','CUS-1');expect(fetch).toHaveBeenCalledWith('/api/v1/customers/CUS-1',expect.objectContaining({method:'PATCH'}));
  fetch.mockClear();await expect(saveCustomer('   ')).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
test('requests keep credentials on the same origin and never echo private server errors',async()=>{
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({detail:'PRIVATE_SERVER_DATA'}),{status:403}));
  vi.stubGlobal('fetch',fetch);
  await expect(request('cases')).rejects.toBeInstanceOf(ApiError);
  await expect(request('cases')).rejects.not.toThrow('PRIVATE_SERVER_DATA');
  expect(fetch).toHaveBeenCalledWith('/api/v1/cases',expect.objectContaining({credentials:'same-origin'}));
});
test('logout never sends a state-changing request without a csrf token',async()=>{
  vi.stubGlobal('sessionStorage',{getItem:()=>null});const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  await expect(logout()).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
test('logout sends csrf in a header and clears it only after success',async()=>{
  const removeItem=vi.fn();vi.stubGlobal('sessionStorage',{getItem:()=> 'test-csrf',removeItem});
  const fetch=vi.fn().mockResolvedValue(new Response(null,{status:204}));vi.stubGlobal('fetch',fetch);
  await logout();expect(fetch).toHaveBeenCalledWith('/api/v1/auth/logout',expect.objectContaining({method:'POST',headers:expect.objectContaining({'X-CSRF-Token':'test-csrf'})}));expect(removeItem).toHaveBeenCalledWith('krt_csrf');
});
