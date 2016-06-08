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
      this.scope = new Proxy({}, {
        set: (target, property, value, receiver) => {
          target[property] = value;

          if (!this.scanned) {
            this.feedbackQueue.push(property);
          } else {
            this.feedbackToUI(property, value);
          }
          return true;
        }
      });
      this.scanned = false; // already scanned
      this.feedbackQueue = []; // queue
      this.model2elements = {};

      const template = this.template();
      const html = document.createElement("div");
      html.innerHTML = template;
      this.templateElement = html;

      this.initialize();

      this.render();
    }

    initialize() {
      // nop. abstract method.
    }

    render() {
      console.log("render");
      IncrementalDOM.patch(this, () => {
        const children = this.templateElement.children;
        for (let i = 0; i < children.length; ++i) {

          this.renderDOM(children[i]);
        }
      });
    }

    renderDOM(elem) {
      if (elem instanceof Text) {
        IncrementalDOM.text(elem.textContent);
        return;
      }
      IncrementalDOM.elementOpenStart(elem.tagName.toLowerCase());
      let modelName;
      const attrs = elem.attributes;
      for (let i = 0, l = attrs.length; i < l; ++i) {
        const attr = attrs[i];
        const attrName = attr.name;
        if (attrName.startsWith('sj-')) {
          let event = sj_attr2event[attrName];
          if (event) {
            IncrementalDOM.attr(event, (e) => {
              this[attr.value](e);
            });
          } else if (attr.name === 'sj-model') {
            modelName = attr.value;
            IncrementalDOM.attr("onchange", (e) => {
              this.scope[attr.value] = e.target.value;
              this.render();
            });
            if (!this.scope[attr.value]) {
              this.scope[attr.value] = elem.value;
            }
          }
        } else {
          IncrementalDOM.attr(attr.name, attr.value);
        }
      }
      if (modelName && this.scope[modelName] && isFormElement(elem)) {
        IncrementalDOM.attr("value", this.scope[modelName]);
      }
      IncrementalDOM.elementOpenEnd(elem.tagName.toLowerCase());
      const children = elem.childNodes;
      for (let i = 0, l = children.length; i < l; ++i) {
        this.renderDOM(children[i]);
      }
      if (modelName && this.scope[modelName] && !isFormElement(elem)) {
        IncrementalDOM.text(this.scope[modelName]);
      }
      IncrementalDOM.elementClose(elem.tagName.toLowerCase());
    }

    go() {
      if (!this.scanned) {
        for (const property of this.feedbackQueue) {
          this.feedbackToUI(property, this.scope[property]);
        }

        this.feedbackQueue = [];
        this.scanned = true;
      }
    }

    template() {
      throw "Please implement 'template' method";
    }

    bindModel(elem, name) {
      if (!this.model2elements[name]) {
        this.model2elements[name] = new Set();
      }
      this.model2elements[name].add(elem);

      if (
          elem instanceof HTMLInputElement
          || elem instanceof HTMLTextAreaElement
          || elem instanceof HTMLSelectElement
      ) {
        if (!this.scope[name]) {
          this.scope[name] = elem.value;
        }
        elem.addEventListener('change', e => {
          this.scope[name] = elem.value;
        });
      }
    }

    feedbackToUI(property, value) {
      let elems = this.model2elements[property];
      if (elems) {
        for (let elem of elems.keys()) {
          this.feedbackToElement(elem, value);
        }
      }
    }

    feedbackToElement(elem, value) {
      if (isFormElement(elem)) {
        elem.value = value;
      } else if (elem instanceof HTMLSpanElement) {
        elem.textContent = value;
      }
    }

  }
  window.HTMLElementBase = HTMLElementBase;

})(this);
