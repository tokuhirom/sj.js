require('./src/sj-expression');
const assert = require('assert');

const e = sjExpression;

assert.equal(e.getValueByPath({"x": "y"}, 'x'), 'y');
assert.equal(e.getValueByPath({"$x": "y"}, '$x'), 'y');
assert.equal(e.getValueByPath({"x": {"y": "z"}}, 'x.y'), 'z');
assert.equal(e.getValueByPath({"bar":[{"boo":4649},{"boo":1},{"boo":2},{"boo":3}],"x":{"boo":3},"$index":3}, 'x.boo'), '3');
assert.equal(e.getValueByPath(
    {
      "x": () => {
        return 3
      }
    }, 'x()'), 3);
assert.equal(e.getValueByPath(
    {
      "add": (x,y) => {
        return x+y;
      }
    }, 'add(3,5)'), 8);

