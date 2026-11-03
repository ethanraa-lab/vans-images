import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageSearch, normalizeCode, parseResults} from '../lib/search.js';
test('code validation rejects queries and normalizes case',()=>{
 assert.equal(normalizeCode(' vn000d3hy28 '),'VN000D3HY28');
 for(const value of ['', '../secret', 'shoe OR cat', 'x'.repeat(41)])assert.throws(()=>normalizeCode(value));
});
test('search requires configuration and never makes a request without a key',async()=>{
 const search=createImageSearch({fetchImpl:()=>{throw Error('must not call')}});
 await assert.rejects(search('VN000D3HY28'),e=>e.status===503);
});
test('maps original URLs, removes duplicates/unsafe links and prioritizes code mentions',()=>{
 const data={results:[
 {title:'A shoe',url:'https://shop.example/product',properties:{url:'https://cdn.example/a.jpg'}},
 {title:'VN000D3HY28 shoe',url:'https://shop.example/vn000d3hy28',properties:{url:'https://cdn.example/b.jpg',width:1200}},
 {properties:{url:'https://cdn.example/b.jpg'}},
 {properties:{url:'javascript:alert(1)'}},{properties:{url:'https://127.0.0.1/a'}},
 {thumbnail:{src:'https://proxy.example/thumb.jpg'}}]};
 const rows=parseResults(data,'VN000D3HY28');assert.equal(rows.length,2);assert.equal(rows[0].url,'https://cdn.example/b.jpg');assert.equal(rows[0].codeMentioned,true);assert.equal(rows[0].page,'https://shop.example/vn000d3hy28');
});
test('provider request uses exact code and server header; repeated code uses cache',async()=>{
 let calls=0;
 const search=createImageSearch({apiKey:'test-key',fetchImpl:async(url,options)=>{
 calls++;assert.equal(url.origin,'https://api.search.brave.com');assert.equal(url.searchParams.get('q'),'Vans "VN000D3HY28"');assert.equal(url.searchParams.get('spellcheck'),'false');assert.equal(options.headers['X-Subscription-Token'],'test-key');
 return {ok:true,json:async()=>({results:[]})};}});
 const result=await search('VN000D3HY28');assert.equal(result.cached,false);assert.equal((await search('VN000D3HY28')).cached,true);assert.equal(calls,1);assert.ok(!JSON.stringify(result).includes('test-key'));
 await assert.rejects(search('VN000D8BBLK'),e=>e.status===429);
});
test('quota and authentication failures produce useful sanitized errors',async()=>{
 for(const status of [401,403,429,500]){
 const search=createImageSearch({apiKey:'secret',fetchImpl:async()=>({ok:false,status})});
 await assert.rejects(search('VN000D3HY28'),e=>e.status===(status===429?429:502)&&!e.message.includes('secret'));
 }
});
