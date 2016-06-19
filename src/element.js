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
    console.log("CREATED " + this.tagName);
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

//  // overwrite by attribute values
//  const attrs = this.attributes;
//  for (let i = 0, l = attrs.length; i < l; ++i) {
//    const attr = attrs[i];
//    if (attr.name.substr(0, 8) !== 'sj-attr-') {
//      def[attr.name] = attr.value;
//    }
//  }

    // and set to tag attributes
    console.trace("SETTING VALUES");
    console.log(def);
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

  attributeChangedCallback(key) {
    console.log(`SET ATTRIBUTE: ${key}`);
    this[key] = this.getAttribute(key);
    this.update();
  }

  initialize() {
    // nop. abstract method.
  }

  update() {
    console.log("UPDATE");
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

