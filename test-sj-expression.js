const e = require('./sj-expression');
const assert = require('assert');
assert.equal(e.sjExpression.getValueByPath({"x": "y"}, 'x'), 'y');
assert.equal(e.sjExpression.getValueByPath({"x": {"y": "z"}}, 'x.y'), 'z');
assert.equal(e.sjExpression.getValueByPath(
    {
      "x": () => {
        return 3
      }
    }, 'x()'), 3);
