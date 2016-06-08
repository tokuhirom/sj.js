(function (window) {
  const sj_attr2event = {
    'sj-click': 'click',
    'sj-submit': 'submit'
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

      this.initialize();
      this.go();
    }

    initialize() {
      // nop. abstract method.
    }

    go() {
      console.log(`scanning ${this.tagName}`);
      this.scanElements();
      if (!this.scanned) {
        for (const property of this.feedbackQueue) {
          this.feedbackToUI(property, this.scope[property]);
        }

        this.feedbackQueue = [];
        this.scanned = true;
      }
    }

    scanElements() {
      let children = this.querySelectorAll("*");
      for (let i = 0; i < children.length; ++i) {
        let child = children[i];
        let attrs = child.attributes;
        for (let j = 0; j < attrs.length; j++) {
          let attr = attrs[j];
          if (attr.name.startsWith('sj-')) {
            let event = sj_attr2event[attr.name];
            if (event) {
              this.registerListener(child, event, attr.value);
            } else if (attr.name == 'sj-model') {
              this.bindModel(child, attr.value);
            }
          }
        }
      }
    }

    registerListener(elem, name, callback) {
      elem.addEventListener(name, e => {
        this[callback](e);
      });
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
