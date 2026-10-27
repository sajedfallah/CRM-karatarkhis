const {test}=require('node:test');
const assert=require('node:assert/strict');
const handler=require('../api/telegram-webhook.js');
const secret='s'.repeat(40);
function response(){return {code:0,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(value){this.body=value;return this;}};}
test('relay authenticates Telegram before forwarding and keeps upstream failures retryable', async()=>{
  const old={...process.env}, oldFetch=global.fetch;let calls=0;
  try {
    process.env.TELEGRAM_WEBHOOK_SECRET=secret;
    process.env.TELEGRAM_RELAY_SECRET='r'.repeat(40);
    process.env.APPS_SCRIPT_WEB_APP_URL='https://script.google.com/macros/s/test-deployment/exec';
    global.fetch=async(_url,opts)=>{calls++;const body=JSON.parse(opts.body);assert.equal(body.relay_secret,'r'.repeat(40));assert.equal(body.update.update_id,1);return {ok:true,json:async()=>({ok:true})};};
    let res=response();await handler({method:'POST',headers:{},body:{update_id:1}},res);
    assert.equal(res.code,401);assert.equal(calls,0);
    res=response();await handler({method:'GET',headers:{}},res);assert.equal(res.code,405);
    const req={method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:{update_id:1,message:{}}};
    res=response();await handler(req,res);assert.equal(res.code,200);assert.equal(calls,1);
    global.fetch=async()=>({ok:true,json:async()=>({ok:false})});
    res=response();await handler(req,res);assert.equal(res.code,502);
    delete process.env.TELEGRAM_RELAY_SECRET;
    res=response();await handler(req,res);assert.equal(res.code,503);
  } finally {process.env=old;global.fetch=oldFetch;}
});
