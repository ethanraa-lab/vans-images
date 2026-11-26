import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function helpers(check=async()=>true){
 const build=readFileSync(new URL('../scripts/build-pages.js',import.meta.url),'utf8');
 const line=build.split('\n').find(l=>l.startsWith('app+=')&&l.includes('function mirroredImageUrl'));
 const context=vm.createContext({URL,check,busy:0,render:()=>{},say:()=>{}});
 vm.runInContext(JSON.parse(line.slice(5,-1)),context);return context;
}
test('mirror URL toggles reversibly and retains all other URL components',()=>{
 const c=helpers(),url='https://assets.vans.eu/images/t_img/f_auto,q_auto,w_1000/VN000EHHNVY-HERO/vans.jpg?x=1';
 const flipped=c.mirroredImageUrl(url);assert.ok(c.isMirrored(flipped));
 assert.equal(c.mirroredImageUrl(flipped),url);
 assert.equal(c.mirroredImageUrl('https://example.com/image.jpg'),null);
 assert.equal(c.mirroredImageUrl('https://assets.vans.eu.example.com/images/t_img/photo.jpg'),null);
});
test('mirror updates the actual hero URL for export and preserves sub images',async()=>{
 const c=helpers(),url='https://img.vans.com/image/upload/t_Vans-Korea-gallery-660x660px/VN000D1HYB2-HERO.jpg';
 const p={images:[url,'https://example.com/alt.jpg']};
 await c.mirrorHero(p);assert.equal(p.images[0],c.mirroredImageUrl(url));assert.equal(p.images[1],'https://example.com/alt.jpg');
 await c.mirrorHero(p);assert.equal(p.images[0],url);assert.equal(c.busy,0);
});
test('failed mirror leaves original hero intact and unlocks controls',async()=>{
 const c=helpers(async()=>false),url='https://assets.vans.com/images/t_img/f_auto/VN000D3HY28-HERO/vans.png',p={images:[url]};
 await c.mirrorHero(p);assert.equal(p.images[0],url);assert.equal(c.busy,0);
});
