const assert = require('assert');

/**
 * Aggregate values from dom tree
 */
class Aggregator {
  constructor(element) {
    this.element = element;
  }

  aggregate(scope) {
    const elems = this.element.querySelectorAll('input,select,textarea');
    for (let i=0, l=elems.length; i<l; ++i) {
      const val = elems[i].value;
      if (val) {
        const modelName = elems[i].getAttribute('sj-model');
        if (modelName) {
          new Function('$val', `${modelName}=$val`).apply(scope, [val]);
        }
      }
    }
  }
}

module.exports = Aggregator;
