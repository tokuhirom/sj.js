const test = require('tape');
const SJAggregator = require('../src/default-value-aggregator');

test('input', (t) => {
  t.plan(1);
  const div = document.createElement('div');
  div.innerHTML = '<input sj-model="this.hoge" value="iyan">';
  const scope = {};
  new SJAggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('textarea', (t) => {
  t.plan(1);
  const div = document.createElement('div');
  div.innerHTML = '<textarea sj-model="this.hoge">iyan</textarea>';
  const scope = {};
  new SJAggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('select', (t) => {
  t.plan(1);
  const div = document.createElement('div');
  div.innerHTML = '<select sj-model="this.hoge"><option value="iyan" checked>iyan</option></select>';
  const scope = {};
  new SJAggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

