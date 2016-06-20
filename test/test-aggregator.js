const test = require('qunitjs').test;
const Aggregator = require('../src/aggregator');

test('input', (t) => {
  const div = document.createElement('div');
  div.innerHTML = '<input sj-model="this.hoge" value="iyan">';
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('input(checkbox)', (t) => {
  const div = document.createElement('div');
  div.innerHTML = `
  <input type="checkbox" sj-model="this.a" checked="checked">
  <input type="checkbox" sj-model="this.b">
  `;
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    a: true,
    b: false
  });
});

test('input(empty)', (t) => {
  const div = document.createElement('div');
  div.innerHTML = '<input sj-model="this.hoge" value="">';
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: ''
  });
});

test('input(repeat)', (t) => {
  const div = document.createElement('div');
  div.innerHTML = `
  <div sj-repeat="item in this.items">
    <input sj-model="item.hoge" value="">
  </div>`;
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, { });
});

test('textarea', (t) => {
  const div = document.createElement('div');
  div.innerHTML = '<textarea sj-model="this.hoge">iyan</textarea>';
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('select', (t) => {
  const div = document.createElement('div');
  div.innerHTML = '<select sj-model="this.hoge"><option value="iyan" checked>iyan</option></select>';
  const scope = {};
  new Aggregator(div).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

