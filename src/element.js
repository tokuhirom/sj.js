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

      scopes[this.tagName] = {};
      new Aggregator(html).aggregate(scopes[this.tagName]);
      compiled[this.tagName] = new Compiler().compile(html);
    }

    const def = this.default();
    for (const key in def) {
      if (def.hasOwnProperty(key)) {
        this[key] = def[key];
      }
    }

    const scope = scopes[this.tagName];
    for (const key in scope) {
      if (scope.hasOwnProperty(key)) {
        this[key] = scope[key];
      }
    }

    const attrs = this.attributes;
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      this[attr.name] = attr.value;
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

  attributeChangedCallback(key) {
    console.log(`ATTRIBUTE CHANGED: ${key}`);
    this[key] = this.getAttribute(key);
    this.update();
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

