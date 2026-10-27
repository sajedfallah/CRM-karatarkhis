'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/apps-script/Code.gs', 'utf8');
function runtime() {
  const properties = { ADMIN_TELEGRAM_ID:'100', TELEGRAM_RELAY_SECRET:'r'.repeat(40) };
  const ctx = vm.createContext({
    PropertiesService:{ getScriptProperties:()=>({
      getProperty:k=>properties[k] || null, setProperty:(k,v)=>{properties[k]=v;}, deleteProperty:k=>{delete properties[k];}
    }) }, Logger:{log:()=>{}}
  });
  vm.runInContext(source, ctx);
  ctx.jsonResponse = x=>x;
  ctx.logSystem = ()=>{};
  ctx.readRows = ()=>[];
  return {ctx,properties};
}
test('complete Apps Script source loads and unsigned ingress is rejected before routing',()=>{
  const {ctx}=runtime();let routes=0;
  ctx.isDuplicateUpdate=()=>false;ctx.handleMessage=()=>{routes++;};
  const update={update_id:1,message:{from:{id:100},chat:{id:999}}};
  assert.equal(ctx.doPost({postData:{contents:JSON.stringify(update)}}).ok,false);
  assert.equal(routes,0);
  assert.equal(ctx.doPost({postData:{contents:JSON.stringify({relay_secret:'r'.repeat(40),update})}}).ok,true);
  assert.equal(routes,1);
});
test('missing or wrong relay secret and malformed update fail closed',()=>{
  const {ctx,properties}=runtime();
  for(const payload of [{},{relay_secret:'wrong',update:{update_id:1,message:{}}},{relay_secret:'r'.repeat(40),update:{message:{}}}])
    assert.equal(ctx.isTrustedTelegramEnvelopeV427_(payload),false);
  delete properties.TELEGRAM_RELAY_SECRET;
  assert.equal(ctx.isTrustedTelegramEnvelopeV427_({relay_secret:'',update:{update_id:1,message:{}}}),false);
});
test('exact assignment IDs and delimited lists never match prefixes',()=>{
  const {ctx}=runtime();
  assert.equal(ctx.textContainsAnyV412_('USR-100',['USR-10']),false);
  assert.equal(ctx.textContainsAnyV412_('USR-100، USR-10',['USR-10']),true);
  assert.equal(ctx.textContainsAnyV412_('Ali Reza',['Ali']),false);
});
test('legacy names resolve only when unique, foreign explicit daily owner always denied',()=>{
  const {ctx}=runtime();
  const user={'User ID':'U1','نام کامل':'Ali','وضعیت':'فعال'};
  ctx.readRows=()=>[user,{'User ID':'U2','نام کامل':'Ali'}];
  assert.equal(ctx.personalTaskBelongsToUserV420_({'مسئول':'Ali'},user),false);
  assert.equal(ctx.personalTaskBelongsToUserV420_({'مسئول':'U1'},user),true);
  assert.equal(ctx.personalTaskBelongsToUserV420_({'منبع':'PERSONAL:U2','مسئول':'U1'},user),false);
  assert.equal(ctx.personalTaskBelongsToUserV420_({'منبع':'PERSONAL:U1'},user),true);
  ctx.readRows=()=>[user];
  assert.equal(ctx.personalTaskBelongsToUserV420_({'مسئول':'Ali'},user),true);
});
test('customer account without customer ID receives no unassigned company records',()=>{
  const {ctx}=runtime();
  ctx.getWorkspaceSourceSnapshotV412_=()=>({customers:[{'مشتری ID':''}],cases:[{'Customer ID':''}]});
  const data=ctx.getScopedWorkspaceDataV412_({'User ID':'U1','نقش':'مدیر مشتری','وضعیت':'فعال'});
  assert.equal(data.customers.length,0);assert.equal(data.cases.length,0);
});
test('inactive and archived users cannot write from workspaces or personal sync',()=>{
  const {ctx}=runtime();let writes=0;
  ctx.getWorkspaceContextV414_=()=>({userId:'U1',main:false});
  ctx.updateEntityField=()=>{writes++;};ctx.revokeWorkspaceAccessV427_=()=>({});
  for(const status of ['غیرفعال','آرشیو','']){
    const user={'User ID':'U1','نقش':'کارمند داخلی','وضعیت':status};
    ctx.getRowById=()=>user;
    ctx.handleRoleWorkspaceEditV424_({source:{getId:()=> 'S1'},range:{}});
    assert.equal(ctx.upsertPersonalTaskFromWorkspaceV420_({},user).reason,'inactive_user');
    assert.throws(()=>ctx.syncWorkspaceDataV412_({fileId:'S1'},user),/inactive_user/);
  }
  assert.equal(writes,0);
});
test('active scoped single-cell workspace edits still reach central CRM',()=>{
  const {ctx}=runtime();let writes=0;
  ctx.getWorkspaceContextV414_=()=>({userId:'U1',main:false});
  ctx.getRowById=()=>({'User ID':'U1','نقش':'کارمند داخلی','وضعیت':'فعال'});
  ctx.roleViewSpecV424_=()=>({editable:true,entity:'cases',columns:['وضعیت']});
  ctx.workspaceRoleRowV424_=()=>({'Case ID':'CASE-1'});
  ctx.entityRowBelongsToUserScopeV424_=()=>true;ctx.updateEntityField=()=>{writes++;return true;};
  ctx.clearFastCachesV413_=()=>{};
  ctx.handleRoleWorkspaceEditV424_({source:{getId:()=> 'S1',toast:()=>{}},range:{
    getSheet:()=>({getName:()=> 'cases'}),getNumRows:()=>1,getNumColumns:()=>1,getRow:()=>2,getColumn:()=>1,getValue:()=> 'new'
  }});
  assert.equal(writes,1);
});
test('sync rotates across 45 mappings, inactive mappings do not consume batch capacity',()=>{
  const {ctx,properties}=runtime();const visited=[];
  const mappings=Array.from({length:45},(_,i)=>({'User ID':'U'+i,'Workspace URL':'url','Spreadsheet ID':'S'+i}));
  ctx.readRows=()=>mappings;
  ctx.getRowById=(_cfg,id)=>({'User ID':id,'وضعیت':id==='U0'?'غیرفعال':'فعال'});
  ctx.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})};
  ctx.syncWorkspaceDataV412_=w=>{visited.push(w.fileId);return {};};
  ctx.upsertObject=()=>{};ctx.nowFa=()=>'';ctx.getAdminPersonalUserV420_=()=>({});
  ctx.SpreadsheetApp={openById:()=>({})};ctx.syncPersonalDailyTasksV420_=()=>({});
  for(let i=0;i<3;i++)ctx.syncAllActiveWorkspacesV412();
  assert.equal(new Set(visited).size,44);assert.equal(visited.includes('S0'),false);
  assert.equal(visited.slice(0,20).length,20);
  properties.WORKSPACE_SYNC_CURSOR_V427='corrupt';
  assert.equal(ctx.syncAllActiveWorkspacesV412().synced,20);
});
test('revocation removes direct grants and skips protected files',()=>{
  const {ctx}=runtime();const removed=[];
  ctx.readRows=()=>[{'User ID':'U1','Spreadsheet ID':'S1','Gmail مشترک‌شده':'user@example.test'}];
  ctx.protectedDriveIdsV413_=()=>({});
  ctx.DriveApp={getFileById:id=>({removeEditor:mail=>removed.push([id,mail]),removeViewer:()=>{}})};
  assert.equal(ctx.revokeWorkspaceAccessV427_({'User ID':'U1'}).revoked,1);
  assert.equal(removed.length,1);
  ctx.protectedDriveIdsV413_=()=>({S1:true});
  assert.equal(ctx.revokeWorkspaceAccessV427_({'User ID':'U1'}).revoked,0);
});
test('webhook setup preserves pending updates and validates all config before registration',()=>{
  const {ctx,properties}=runtime();let sent;
  properties.TELEGRAM_WEBHOOK_URL='https://relay.example.test/api/telegram-webhook';
  properties.TELEGRAM_WEBHOOK_SECRET='s'.repeat(40);
  ctx.telegramApi=(method,payload)=>{sent={method,payload};return {ok:true};};
  ctx.setTelegramWebhook();
  assert.equal(sent.method,'setWebhook');assert.equal(sent.payload.drop_pending_updates,false);
  assert.equal(sent.payload.secret_token,properties.TELEGRAM_WEBHOOK_SECRET);
  delete properties.TELEGRAM_RELAY_SECRET;assert.throws(()=>ctx.setTelegramWebhook(),/TELEGRAM_RELAY_SECRET/);
});

