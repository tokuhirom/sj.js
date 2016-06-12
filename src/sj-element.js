const sj = require('./sj');
const SJRenderer = sj.SJRenderer;
const SJAggregater = sj.SJAggregater;

// babel hacks
// See https://phabricator.babeljs.io/T1548
if (typeof HTMLElement !== 'function') {
  var _HTMLElement = function () {
  };
  _HTMLElement.prototype = HTMLElement.prototype;
  HTMLElement = _HTMLElement;
}

class SJElement extends HTMLElement {
  createdCallback() {
    // parse template
    var template = this.template();
    if (!template) {
      throw `template shouldn't be null`;
    }

    const html = document.createElement("div");
    html.innerHTML = template;
    new SJAggregater(html).aggregate(this);
    this.renderer = new sj.SJRenderer(this, html);

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
    this.renderer.render();
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

module.exports.Element = SJElement;

