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

const scopes = {};
const compiled = {};

class Element extends HTMLElement {
  createdCallback() {
    if (!scopes[this.tagName]) {
      // parse template
      var template = this.template();
      if (!template) {
        throw `template shouldn't be null`;
      }

      const html = document.createElement("div");
      html.innerHTML = template;

      scopes[this.tagName] = this.default();
      new Aggregator(html).aggregate(scopes[this.tagName]);
      compiled[this.tagName] = new Compiler().compile(html);
    }

    const def = {};

    // overwrite by scope values
    const scope = scopes[this.tagName];
    for (const key in scope) {
      if (scope.hasOwnProperty(key)) {
        def[key] = scope[key];
      }
    }

    // and set to tag attributes
    for (const key in def) {
      if (def.hasOwnProperty(key)) {
        this[key] = def[key];
      }
    }

    this.initialize();

    this.update();
  }

  default() {
    return {};
  }

  template() {
    throw "Please implement 'template' method";
  }

  initialize() {
    // nop. abstract method.
  }

  update() {
    IncrementalDOM.patch(this, () => {
      compiled[this.tagName].apply(this, [IncrementalDOM]);
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

