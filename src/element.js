const Compiler = require('./compiler.js');
const Aggregator = require('./aggregator.js');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

// babel hacks
// See https://phabricator.babeljs.io/T1548
if (typeof HTMLElement !== 'function') {
  var _HTMLElement = function () {
  };
  _HTMLElement.prototype = HTMLElement.prototype;
  HTMLElement = _HTMLElement;
}

class Element extends HTMLElement {
  createdCallback() {
    // parse template
    var template = this.template();
    if (!template) {
      throw `template shouldn't be null`;
    }

    const html = document.createElement("div");
    html.innerHTML = template;
    new Aggregator(html).aggregate(this);
    this.compiled = new Compiler().compile(html);

    this.initialize();

    this.update();
  }

  template() {
    throw "Please implement 'template' method";
  }

  attributeChangedCallback(key) {
    this[key] = this.getAttribute(key);
    this.update();
  }

  initialize() {
    // nop. abstract method.
  }

  update() {
    IncrementalDOM.patch(this, () => {
      this.compiled.apply(this, [IncrementalDOM]);
    });
  }

  dump() {
    const scope = {};
    Object.keys(this).forEach(key => {
      if (key !== 'renderer') {
        scope[key] = this[key];
      }
    });
    return scope;
  }
}

module.exports = Element;

