const jsdom = require('jsdom');
const test = require('tape');
const SJAggregater = require('../src/sj').SJAggregater;

test('input', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<input sj-model="hoge" value="iyan">');
  t.deepEqual(new SJAggregater(e).aggregate(), {
    hoge: 'iyan'
  });
});

test('textarea', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<textarea sj-model="hoge">iyan</textarea>');
  t.deepEqual(new SJAggregater(e).aggregate(), {
    hoge: 'iyan'
  });
});

test('select', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<select sj-model="hoge"><option value="iyan" checked>iyan</option></select>');
  t.deepEqual(new SJAggregater(e).aggregate(), {
    hoge: 'iyan'
  });
});

