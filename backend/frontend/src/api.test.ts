import {afterEach,expect,test,vi} from 'vitest';
import {request,logout,ApiError} from './api';
afterEach(()=>vi.unstubAllGlobals());
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
