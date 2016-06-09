require('../src/sj-expression');
var assert = require('chai').assert;

const e = sjExpression;

describe('getValueByPath', function () {
  it('can get value by path', () => {
    assert.equal(e.getValueByPath({"x": "y"}, 'x'), 'y');
  });
  it('allows $ in path', () => {
    assert.equal(e.getValueByPath({"$x": "y"}, '$x'), 'y');
  });
  it('allows nested path', () => {
    assert.equal(e.getValueByPath({"x": {"y": "z"}}, 'x.y'), 'z');
  });
  it('supports complex data', () => {
    assert.equal(e.getValueByPath({"bar":[{"boo":4649},{"boo":1},{"boo":2},{"boo":3}],"x":{"boo":3},"$index":3}, 'x.boo'), '3');
  });
  it('can call function', () => {
    assert.equal(e.getValueByPath(
      {
        "x": () => {
          return 3
        }
      }, 'x()'), 3);
  });
  it('can pass argument parameters', () => {
    assert.equal(e.getValueByPath(
      {
        "add": (x, y) => {
          return x + y;
        }
      }, 'add(3,5)'), 8);
  });
  it('can pass "this"', () => {
    assert.equal(e.getValueByPath(
      {
        "yy": function () {
          return this.y * 3;
        }
      }, 'yy()', {"y":6}), 18);
  });
});
describe('setValueByPath', () => {
  it('can set value by path', () => {
    const o = {
      "x": {
        "y": 3
      }
    };
    e.setValueByPath(o, 'x.y', 8);
    e.setValueByPath(o, 'o', 9);
    assert.equal(o.x.y, 8);
    assert.equal(o.o, 9);
  });
});

