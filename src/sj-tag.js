const SJRenderer = require('./sj').SJRenderer;

class SJTagBuilder {
  constructor(klass) {
    this.klass = klass;
  }

  accessor(name, opts) {
    return this;
  }
}

function sjtag(tagName, opts) {
  const template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  const elementClassPrototype = Object.create(HTMLElement.prototype);
  const elementClass = class extends HTMLElement {
    createdCallback() {
      this.scope = {};

      const html = document.createElement("div");
      html.innerHTML = (function () {
        if (template instanceof Function) {
          return template.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
        } else {
          return template;
        }
      })();
      this.renderer = new SJRenderer(this, html, this.scope);

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
  };
  if (opts.accessors) {
    for (const name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, name, {
        get: opts.accessors[name].get,
        set: opts.accessors[name].set
      });
    }
  }

  customElements.define(tagName, elementClass);

  return new SJTagBuilder(elementClass);
}

module.exports.sjtag = sjtag;

