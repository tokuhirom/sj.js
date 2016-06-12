const assert = require('assert');

class DefaultValueAggregator {
  constructor(element, expressionRunner) {
    assert(expressionRunner);
    this.element = element;
    this.expressionRunner = expressionRunner;
  }

  aggregate(scope) {
    const elems = this.element.querySelectorAll('input,select,textarea');
    for (let i=0, l=elems.length; i<l; ++i) {
      const val = elems[i].value;
      if (val) {
        const modelName = elems[i].getAttribute('sj-model');
        this.expressionRunner.setValueByPath(scope, modelName, val);
      }
    }
  }
}

module.exports = DefaultValueAggregator;

