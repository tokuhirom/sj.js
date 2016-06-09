const e = require('./src/sj-expression');
const assert = require('assert');
assert.equal(e.getValueByPath({"x": "y"}, 'x'), 'y');
assert.equal(e.getValueByPath({"x": {"y": "z"}}, 'x.y'), 'z');
assert.equal(e.getValueByPath(
    {
      "x": () => {
        return 3
      }
    }, 'x()'), 3);
    /*
assert.equal(e.getValueByPath(
    {
      "add": (x,y) => {
        return x+y;
      }
    }, 'x(3,5)'), 8);
    */
