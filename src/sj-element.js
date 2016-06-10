const sj = require('./sj');
        
class SJElement extends HTMLElement {
  createdCallback() {
    this.scope = {};

    // parse template
    var template = this.template();
    if (template instanceof Function) {
      template = template.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1];
    }
    const html = document.createElement("div");
    html.innerHTML = template;
    this.renderer = new sj.SJRenderer(this, html, this.scope);

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
}

module.exports.Element = SJElement;

