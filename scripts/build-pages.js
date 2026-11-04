import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
const output=new URL('../pages-dist/',import.meta.url);
await mkdir(output,{recursive:true});
let html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
let app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
html=html.replace('<button id="logout" style="margin-left:16px">Log out</button>','');
html=html.replace('Add products + look up images','Add products + find Vans images');
html=html.replace('Checking image search configuration…','Vans US image lookup · Paste codes or upload a catalog to load available official images here. No API key needed.');
html=html.replace('Search returns candidate images for each code. Review the product and colour, then click Keep to add images to your export. Only your retained images are exported.','Images load directly from Vans assets. US availability varies by style code. Review the product, colour and hero order before export. Your workspace stays in this browser.');
app=app.replace('⌕ Search images','Retry Vans images');
app=app.replace('<button data-action="cdn" data-p="${n}">Try Vans CDN pattern</button>','');
app=app.replace(/<a target="_blank" rel="noopener" href="https:\/\/www\.google\.com\/search[^]*?<\/a>/,'');
app=app.replace("Try lookup or add direct image URLs.","Try Vans lookup again or add direct image URLs.");
app=app.replace("say('Search finished. Review candidates under each product; click Keep for the images you want.')","say('Vans lookup finished. Review the images and rearrange your hero view before export.')");
app=app.replace(/async function cdnLookup\(p\)\{[^]*?(?=\$\('#add'\))/, '');
// Replace backend-only functions; there are no API calls or auth redirects in the Pages build.
const start=app.indexOf('async function lookup(p){');
if(start<0)throw Error('Cannot locate backend section; review Pages build script.');
app=app.slice(0,start)+`async function lookup(p){return cdnLookup(p)}
async function cdnLookup(p){
 busy++;p.status='Checking official Vans hero and alternate views…';render();
 try{
  const code=p.code.trim().toUpperCase();
  if(!/^VN[A-Z0-9]{6,14}$/.test(code)){p.status='Enter a Vans style code beginning with VN, or add direct image URLs.';return;}
  const views=['HERO',...Array.from({length:8},(_,i)=>'ALT'+(i+1))];
  const before=p.images.length;
  await addUrls(p,views.map(view=>'https://assets.vans.com/images/t_img/f_auto,q_auto,w_1000/'+code+'-'+view+'/vans.png'));
  const added=p.images.length-before;
  p.status=added?added+' official Vans images added. Review the colour and set your hero view.':p.images.length?'No additional views found. Your current images are kept.':'No images loaded from Vans. This style may be unavailable or image access may be blocked. Retry or add direct image URLs.';
 }catch{p.status='Vans lookup could not finish. Retry or add direct image URLs.';}
 finally{busy--;render();}
}
`;

if(/fetch\(|location\.replace\(/.test(app))throw Error('Backend dependency unexpectedly remains.');
await writeFile(new URL('index.html',output),html);
await writeFile(new URL('app.js',output),app);
await copyFile(new URL('../node_modules/xlsx/dist/xlsx.full.min.js',import.meta.url),new URL('xlsx.js',output));
await writeFile(new URL('.nojekyll',output),'');
console.log('Built pages-dist: browser-only app and local Excel library. No API keys, login code, or backend files included.');
