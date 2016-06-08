(function (window) {
  const sj_attr2event = {
    'sj-click': 'onclick',
    'sj-submit': 'onsubmit'
  };

  function isFormElement(elem) {
    return elem instanceof HTMLInputElement
           || elem instanceof HTMLTextAreaElement
           || elem instanceof HTMLSelectElement;
  }

  class HTMLElementBase extends HTMLElement {
    createdCallback() {
      this.scope = {};

      // parse template
      const template = this.template();
      const html = document.createElement("div");
      html.innerHTML = template;
      this.templateElement = html;

      this.initialize();

      this.render();
    }

    template() {
      throw "Please implement 'template' method";
    }

    initialize() {
      // nop. abstract method.
    }

    render() {
      IncrementalDOM.patch(this, () => {
        const children = this.templateElement.children;
        for (let i = 0; i < children.length; ++i) {

          this.renderDOM(children[i], this.scope);
        }
      });
    }

    renderDOM(elem, scope) {
      if (elem instanceof Text) {
        IncrementalDOM.text(elem.textContent);
        return;
      }
      IncrementalDOM.elementOpenStart(elem.tagName.toLowerCase());
      const modelName = this.renderAttributes(elem, scope);
      if (modelName && scope[modelName] && isFormElement(elem)) {
        IncrementalDOM.attr("value", scope[modelName]);
      }
      IncrementalDOM.elementOpenEnd(elem.tagName.toLowerCase());
      const children = elem.childNodes;
      for (let i = 0, l = children.length; i < l; ++i) {
        this.renderDOM(children[i], scope);
      }
      if (modelName && scope[modelName] && !isFormElement(elem)) {
        IncrementalDOM.text(scope[modelName]);
      }
      IncrementalDOM.elementClose(elem.tagName.toLowerCase());
    }

    renderAttributes(elem, scope) {
      let modelName;
      const attrs = elem.attributes;
      for (let i = 0, l = attrs.length; i < l; ++i) {
        const attr = attrs[i];
        const attrName = attr.name;
        if (this.renderAttribute(attrName, attr, elem, scope)) {
          modelName = attr.value;
        }
      }
      return modelName;
    }

    renderAttribute(attrName, attr, elem, scope) {
      let isModelAttribute;
      if (attrName.startsWith('sj-')) {
        const event = sj_attr2event[attrName];
        if (event) {
          IncrementalDOM.attr(event, (e) => {
            this[attr.value](e);
          });
        } else if (attr.name === 'sj-model') {
          isModelAttribute = attr.value;
          IncrementalDOM.attr("onchange", (e) => {
            scope[attr.value] = e.target.value;
            this.render();
          });
          if (!scope[attr.value]) {
            scope[attr.value] = elem.value;
          }
        }
      } else {
        IncrementalDOM.attr(attr.name, attr.value);
      }
      return isModelAttribute;
    }

  }
  window.HTMLElementBase = HTMLElementBase;

})(this);
