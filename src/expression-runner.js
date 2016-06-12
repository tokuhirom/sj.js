const assert = require('assert');

// http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
var createFunction = (function() {
  function F(args) {
    return Function.apply(this, args);
  }
  F.prototype = Function.prototype;

  return function() {
    return new F(arguments);
  }
})();

class ExpressionRunner {
  constructor() {
    this.eval_cache = {};
    this.set_cache = {};
  }

  evalExpression(self, expression, lexVarNames, lexVarValues) {
    assert(arguments.length === 4);
    assert(Array.isArray(lexVarNames));
    // assert(self instanceof HTMLElement);
    // console.log(`evalExpression:${JSON.stringify(self.dump())}, ${expression}, lexVarNames:${JSON.stringify(lexVarNames)}, lexVarValues:${JSON.stringify(lexVarValues)}`);

    const cache_key = expression+"\t"+lexVarNames.join("\t");
    if (!this.eval_cache[cache_key]) {
      this.eval_cache[cache_key] = createFunction.apply(null, lexVarNames.concat([`return ${expression}`]));
    }
    return this.eval_cache[cache_key].apply(self, lexVarValues);
  }

  setValueByPath(self, expression, value) {
    assert(arguments.length === 3);
    // assert(self instanceof HTMLElement);
    // console.log(`setValueByPath: ${self}, ${expression}, ${value}`);

    if (!this.set_cache[expression]) {
      this.set_cache[expression] = new Function('$value', `${expression}=$value`);
    }
    this.set_cache[expression].apply(self, [value]);
  }
}

module.exports = ExpressionRunner;

