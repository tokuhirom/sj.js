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
      const elem = elems[i];
      const modelName = elem.getAttribute('sj-model');
      if (modelName && modelName.substr(0,5) === 'this.') {
        const val = elem.type === 'checkbox' ? elem.checked : elem.value;
        new Function('$val', `if (!${modelName}) { ${modelName}=$val; }`).apply(scope, [val]);
      }
    }
  }
}

module.exports = Aggregator;

