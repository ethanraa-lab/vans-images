import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

function regional(check=async()=>false){
 const build=readFileSync(new URL('../scripts/build-pages.js',import.meta.url),'utf8');
 const marker='app=app.slice(0,start)+';
 const line=build.split('\n').find(line=>line.startsWith(marker));
 const code=JSON.parse(line.slice(marker.length,-1));
 const context=vm.createContext({URL,check});
 vm.runInContext(code.slice(0,code.indexOf('async function lookup(')),context);
 return context;
}
test('Australian fallback discovers a full-code gallery without a per-product entry',async()=>{
 const c=regional(async url=>url.includes('/vn000eb7ba2_bkw_01.jpg?'));
 const urls=await c.australasiaImages('vn000eb7ba2','www.vans.com.au');
 assert.equal(urls.length,8);
 assert.ok(urls.every(url=>url.startsWith('https://www.vans.com.au/media/catalog/product/v/n/vn000eb7ba2_bkw_')));
});
test('New Zealand discovery rejects non-VN input and does not accept failed probes',async()=>{
 let probes=0;const c=regional(async()=>{probes++;return false;});
 assert.equal((await c.australasiaImages('anything','www.vans.co.nz')).length,0);
 assert.equal(probes,0);
 assert.equal((await c.australasiaImages('VN000EB7BA2','www.vans.co.nz')).length,0);
 assert.equal(probes,5);
});
test('known Australian galleries remain available and Finland shares the European source',async()=>{
 const c=regional(async()=>{throw Error('Known galleries need no pattern probes');});
 assert.equal((await c.australasiaImages('VN000D0SCKK','www.vans.com.au')).length,6);
 assert.ok(c.regionalSources('VN000EHHNVY').some(source=>source.label.includes('Finland')));
 assert.equal(c.imageRegion('https://www.vans.co.nz/media/catalog/product/v/n/vn000eb7ba2_bkw_01.jpg'),'Vans New Zealand');
});
