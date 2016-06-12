const jsdom = require('jsdom');
const test = require('tape');
const SJAggregater = require('../src/sj').SJAggregater;
const ExpressionRunner = require('../src/expression-runner.js');

const expressionRunner = new ExpressionRunner();

test('input', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<input sj-model="this.hoge" value="iyan">');
  const scope = {};
  new SJAggregater(e, expressionRunner).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('textarea', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<textarea sj-model="this.hoge">iyan</textarea>');
  const scope = {};
  new SJAggregater(e, expressionRunner).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

test('select', (t) => {
  t.plan(1);
  const e = jsdom.jsdom('<select sj-model="this.hoge"><option value="iyan" checked>iyan</option></select>');
  const scope = {};
  new SJAggregater(e, expressionRunner).aggregate(scope);
  t.deepEqual(scope, {
    hoge: 'iyan'
  });
});

