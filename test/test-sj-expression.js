const e = require('../src/sj-expression');
const test = require('tape');

test('getValueByPath', t => {
  t.plan(8);

  t.test('can get value by path', t => {
    t.plan(1);
    t.equal(e.getValueByPath({"x": "y"}, 'x'), 'y');
  });
  t.test('allows $ in path', t => {
    t.plan(1);
    t.equal(e.getValueByPath({"$x": "y"}, '$x'), 'y');
  });
  t.test('returns undefined if undefined path', t => {
    t.plan(1);
    t.equal(e.getValueByPath({"$x": "y"}, 'x.y.z'), undefined);
  });
  t.test('allows nested path', t => {
    t.plan(1);
    t.equal(e.getValueByPath({"x": {"y": "z"}}, 'x.y'), 'z');
  });
  t.test('supports complex data', t => {
    t.plan(1);
    t.equal(e.getValueByPath({"bar":[{"boo":4649},{"boo":1},{"boo":2},{"boo":3}],"x":{"boo":3},"$index":3}, 'x.boo'), 3);
  });
  t.test('can call function', t => {
    t.plan(1);
    t.equal(e.getValueByPath(
      {
        "x": t => {
          return 3
        }
      }, 'x()'), 3);
  });
  t.test('can pass argument parameters', t => {
    t.plan(1);
    t.equal(e.getValueByPath(
      {
        "add": (x, y) => {
          return x + y;
        }
      }, 'add(3,5)'), 8);
  });
  t.test('can pass "this"', t => {
    t.plan(1);
    t.equal(e.getValueByPath(
      {
        "yy": function () {
          return this.y * 3;
        }
      }, 'yy()', {"y":6}), 18);
  });
});
test('setValueByPath', t => {
  t.plan(1);
  t.test('can set value by path', t => {
    t.plan(2);
    const o = {
      "x": {
        "y": 3
      }
    };
    e.setValueByPath(o, 'x.y', 8);
    e.setValueByPath(o, 'o', 9);
    t.equal(o.x.y, 8);
    t.equal(o.o, 9);
  });
});

