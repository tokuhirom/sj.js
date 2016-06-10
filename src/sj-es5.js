const SJRenderer = require('./sj').SJRenderer;

function sjtag(opts) {
  var template = opts.template;
  delete opts['template'];
  if (!template) {
    throw "Missing template";
  }

  const elementClassPrototype = Object.create(HTMLElement.prototype);

  for (var k in opts) {
    elementClassPrototype[k] = opts[k];
  }
  elementClassPrototype.createdCallback = function () {
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

    if (this.initialize) {
      this.initialize();
    }
    this.update();
  };
  elementClassPrototype.update = function () {
    this.renderer.render();
  };
  return {prototype: elementClassPrototype};
}

module.exports.sjtag = sjtag;

