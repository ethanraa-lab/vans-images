import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import XLSX from 'xlsx';
import { readFileSync } from 'node:fs';
function app(extra = {}) {
  const elements = {};
  const context = vm.createContext({
    document: { querySelector: key => elements[key] ||= { value: '', hidden: true } },
    window: { addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    location: { hash: '' },
    URL, URLSearchParams, setTimeout, clearTimeout, ...extra,
  });
  vm.runInContext(readFileSync(new URL('../public/app.js', import.meta.url), 'utf8'), context);
  return code => vm.runInContext(code, context);
}
test('repeated codes merge; export repeats identity and numbers images vertically', () => {
  const run = app();
  run(`get('VN000D3HY28', 'old-skool').images = ['https://example.com/a.jpg','https://example.com/b.jpg']; get('vn000d3hy28');`);
  assert.equal(run('products.length'), 1);
  const rows = JSON.parse(run('JSON.stringify(rows())'));
  assert.deepEqual(rows.map(r => r['Handle']), ['old-skool', 'old-skool']);
  assert.deepEqual(rows.map(r => r['Item Code']), ['VN000D3HY28', 'VN000D3HY28']);
  assert.deepEqual(rows.map(r => r['Image Position']), [1, 2]);
  assert.deepEqual(rows.map(r => r['Image Alt Text']), ['VN000D3HY28- hero view', 'VN000D3HY28- Alt 1']);
});
test('hero reordering and removal recalculate export positions', () => {
  const run = app();
  run(`let p=get('VN000D3HY28','shoe'); p.images=['https://example.com/a.jpg','https://example.com/b.jpg','https://example.com/c.jpg']; p.images.unshift(...p.images.splice(2,1)); p.images.splice(1,1);`);
  const rows = JSON.parse(run('JSON.stringify(rows())'));
  assert.equal(rows[0]['Image Src'], 'https://example.com/c.jpg');
  assert.equal(rows[0]['Image Alt Text'], 'VN000D3HY28- hero view');
  assert.equal(rows[1]['Image Position'], 2);
  assert.equal(rows[1]['Image Alt Text'], 'VN000D3HY28- Alt 1');
});


test('catalog upload reports missing Excel support next to upload status', async () => {
  const run = app();
  await run(`$('#file').onchange({target:{files:[{name:'catalog.xlsx'}],value:'catalog.xlsx'}})`);
  assert.match(run("$('#status').textContent"), /Excel support did not load/);
});
test('Excel catalog imports Handle and Item Code after blank leading rows', async () => {
  const run = app({XLSX});
  await run(`(async()=>{
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([[],['Handle','Item Code'],['standard-handle','VN000DC4BA2']]),'Products');
    const bytes=XLSX.write(wb,{type:'array',bookType:'xlsx'});
    $('#mapping').showModal=()=>{};$('#mapping').close=()=>{};
    await $('#file').onchange({target:{files:[{name:'catalog.xlsx',arrayBuffer:async()=>bytes}],value:'catalog.xlsx'}});
  })()`);
  assert.match(run("$('#status').textContent"), /Catalog opened/);
  await run(`$('#codecol').value='1';$('#handlecol').value='0';$('#imagecol').value='';lookup=async()=>{};$('#import').onclick();`);
  assert.equal(run('products[0].handle'),'standard-handle');
  assert.equal(run('products[0].code'),'VN000DC4BA2');
  assert.equal(run('busy'),0);
});
