const sj = require('./sj');
const SJRenderer = sj.SJRenderer;
const SJAggregater = sj.SJAggregater;

function sjtag(tagName, opts) {
  const template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  const elementClassPrototype = Object.create(HTMLElement.prototype);
  const elementClass = class extends HTMLElement {
    createdCallback() {
      const html = document.createElement("div");
      html.innerHTML = (function () {
        if (template instanceof Function) {
          return template.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
        } else {
          return template;
        }
      })();

      new SJAggregater(html).aggregate(this);
      this.renderer = new SJRenderer(this, html);

      if (opts.initialize) {
        opts.initialize.apply(this);
      }
      this.update();
    }

    attributeChangedCallback(key) {
      this[key] = this.getAttribute(key);
      this.update();
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
  };

  if (opts.methods) {
    for (const name in opts.methods) {
      elementClass.prototype[name] = opts.methods[name];
    }
  }

  if (opts.accessors) {
    for (const name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, name, {
        get: opts.accessors[name].get,
        set: opts.accessors[name].set
      });
    }
  }

  customElements.define(tagName, elementClass);
}

module.exports.sjtag = sjtag;

