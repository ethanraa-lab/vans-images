import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuth, passwordHash } from '../lib/auth.js';
import {spawn} from 'node:child_process';
const hash = await passwordHash('temporary-test-password');
function request(cookie=''){return {headers:{cookie},socket:{remoteAddress:'test'}}}
test('login is locked without configuration',async()=>{
 const auth=createAuth();assert.equal(auth.valid(request()),false);assert.equal((await auth.login(request(),'a','b')).status,503);
});
test('credentials, session cookie, expiry and logout',async()=>{
 let clock=0;const auth=createAuth({username:'team',hash,secure:true,now:()=>clock});
 assert.equal((await auth.login(request(),'wrong','temporary-test-password')).status,401);
 assert.equal((await auth.login(request(),'team','wrong')).status,401);
 const result=await auth.login(request(),'team','temporary-test-password');assert.equal(result.status,200);assert.match(result.cookie,/HttpOnly; SameSite=Strict/);assert.match(result.cookie,/; Secure/);
 const req=request(result.cookie.split(';')[0]);assert.ok(auth.valid(req));auth.logout(req);assert.equal(auth.valid(req),false);
 const next=await auth.login(request(),'team','temporary-test-password');clock=9*3600000;assert.equal(auth.valid(request(next.cookie.split(';')[0])),false);
});
test('login attempts are rate limited',async()=>{
 const auth=createAuth({username:'team',hash});for(let i=0;i<10;i++)assert.equal((await auth.login(request(),'team','wrong')).status,401);
 assert.equal((await auth.login(request(),'team','temporary-test-password')).status,429);
});
test('HTTP app requires login for workspace and APIs and invalidates sessions on logout',async()=>{
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3198',APP_ORIGIN:'http://localhost:3198',TEAM_USERNAME:'team',TEAM_PASSWORD_HASH:hash,BRAVE_SEARCH_API_KEY:'',NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 try{
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',c=>reject(Error('exit '+c)))});
 const url='http://localhost:3198';
 assert.equal((await fetch(url+'/',{redirect:'manual'})).headers.get('location'),'/login');
 assert.equal((await fetch(url+'/app.js',{redirect:'manual'})).status,303);
 assert.equal((await fetch(url+'/api/images?code=VN000D3HY28')).status,401);
 assert.equal((await fetch(url+'/login')).status,200);
 const post=(path,data,origin=url,cookie='')=>fetch(url+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(data)});
 assert.equal((await post('/api/login',{},'https://attacker.example')).status,403);
 let response=await post('/api/login',{username:'team',password:'wrong'});assert.equal(response.status,401);
 response=await post('/api/login',{username:'team',password:'temporary-test-password'});assert.equal(response.status,200);
 const cookie=response.headers.get('set-cookie').split(';')[0];
 for(const path of ['/','/app.js','/xlsx.js'])assert.equal((await fetch(url+path,{headers:{Cookie:cookie}})).status,200);
 assert.equal((await fetch(url+'/api/images?code=VN000D3HY28',{headers:{Cookie:cookie}})).status,503);
 assert.equal((await fetch(url+'/.env',{headers:{Cookie:cookie}})).status,404);
 assert.equal((await post('/api/logout',{},url,cookie)).status,200);
 assert.equal((await fetch(url+'/api/config',{headers:{Cookie:cookie}})).status,401);
 }finally{child.kill()}
});
