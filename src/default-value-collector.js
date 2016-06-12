class DefaultValueCollector {
  constructor(element) {
    this.element = element;
  }

  aggregate(scope) {
    const elems = this.element.querySelectorAll('input,select,textarea');
    for (let i=0, l=elems.length; i<l; ++i) {
      const val = elems[i].value;
      if (val) {
        const modelName = elems[i].getAttribute('sj-model');
        setValueByPath(scope, modelName, val);
      }
    }
  }
}

module.exports = DefaultValueCollector;

