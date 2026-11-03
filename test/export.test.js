import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
function app() {
  const elements = {};
  const context = vm.createContext({
    document: { querySelector: key => elements[key] ||= { value: '', hidden: true } },
    window: { addEventListener: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} }, URL, setTimeout, clearTimeout,
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
