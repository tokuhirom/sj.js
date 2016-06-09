const sjExpression = require('./sj-expression');

const sj_attr2event = {
  'sj-click': 'onclick',
  'sj-blur': 'onblur',
  'sj-checked': 'onchecked',
  'sj-dblclick': 'ondblclick',
  'sj-focus': 'onfocus',
  'sj-keydown': 'onkeydown',
  'sj-keypress': 'onkeypress',
  'sj-keyup': 'onkeyup',
  'sj-mousedown': 'onmousedown',
  'sj-mouseenter': 'onmouseenter',
  'sj-mouseleave': 'onmouseleave',
  'sj-mousemove': 'onmousemove',
  'sj-mouseover': 'onmouseover',
  'sj-mouseup': 'onmouseup',
  'sj-paste': 'onpaste',
  'sj-selected': 'onselected',
  'sj-submit': 'onsubmit'
};

function isFormElement(elem) {
  return elem instanceof HTMLInputElement
         || elem instanceof HTMLTextAreaElement
         || elem instanceof HTMLSelectElement;
}

class SJElement extends HTMLElement {
  createdCallback() {
    this.initialized = false;

    this.scope = new Proxy({}, {
        set: (target, property, value) => {
            target[property] = value;
            if (this.initialized) {
                this.render();
            }
            return true;
        }
    });

    // parse template
    const template = this.template();
    const html = document.createElement("div");
    html.innerHTML = template;
    this.templateElement = html;

    this.initialize();
    this.initialized = true;

    this.render();
  }

  template() {
    throw "Please implement 'template' method";
  }

  initialize() {
    // nop. abstract method.
  }

  render() {
    if (this.rendering) {
      return;
    }

    try {
        this.rendering = true;

        IncrementalDOM.patch(this, () => {
        const children = this.templateElement.children;
        for (let i = 0; i < children.length; ++i) {

            this.renderDOM(children[i], this.scope);
        }
        });
    } finally {
      this.rendering = false;
    }
  }

  renderDOM(elem, scope) {
    if (elem instanceof Text) {
      IncrementalDOM.text(this.replaceVariables(elem.textContent, scope));
      return;
    }
    if (this.shouldHideElement(elem, scope)) {
      return;
    }

    IncrementalDOM.elementOpenStart(elem.tagName.toLowerCase());
    const [modelName, hasForAttribute] = this.renderAttributes(elem, scope);
    const modelValue = modelName? sjExpression.getValueByPath(scope, modelName) : null;
    const isForm = isFormElement(elem);
    if (modelName && modelValue && scope[modelName] && isForm) {
      IncrementalDOM.attr("value", modelValue);
    }
    IncrementalDOM.elementOpenEnd(elem.tagName.toLowerCase());
    const children = elem.childNodes;
    if (!hasForAttribute) {
      for (let i = 0, l = children.length; i < l; ++i) {
        const child = children[i];
        if (child instanceof Text) {
          if (!modelName) {
            IncrementalDOM.text(this.replaceVariables(child.textContent, scope));
          }
        } else {
          this.renderDOM(child, scope);
        }
      }
    }
    if (modelName && modelValue && !isForm) {
      IncrementalDOM.text(modelValue);
    }
    IncrementalDOM.elementClose(elem.tagName.toLowerCase());
  }

  shouldHideElement(elem, scope) {
    const cond = elem.getAttribute('sj-if');
    if (cond) {
      const val = sjExpression.getValueByPath(scope, cond);
      if (!val) {
        return true;
      }
    }
    return false;
  }

  renderAttributes(elem, scope) {
    let modelName;
    const attrs = elem.attributes;
    let hasForAttribute;
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      const attrName = attr.name;
      let hasModelAttribute;
      [hasModelAttribute, hasForAttribute] = this.renderAttribute(attrName, attr, elem, scope);
      if (hasModelAttribute) {
        modelName = attr.value;
      }
    }
    return [modelName, hasForAttribute];
  }

  renderAttribute(attrName, attr, elem, scope) {
    let isModelAttribute;
    let hasForAttribute;
    let hideElement;
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
      } else if (attr.name === 'sj-for') {
        const m = attr.value.match(/^\s*(\w+)\s+in\s+(\w+)\s*$/);
        if (!m) {
          throw "Invalid sj-for value: " + m;
        }
        hasForAttribute = true;

        const varName = m[1];
        const container = m[2];

        const e = elem.querySelector('*');
        for (const item of scope[container]) {
          // TODO: optimize this
          const currentScope = Object.assign({}, scope);
          currentScope[varName] = item;
          this.renderDOM(e, currentScope);
        }
      }
    } else {
      const labelValue = this.replaceVariables(attr.value, scope);
      IncrementalDOM.attr(attr.name, labelValue);
    }
    return [isModelAttribute, hasForAttribute];
  }

  replaceVariables(label, scope) {
      console.log(label);
    return label.replace(/\{\{(\w+)\}\}/g, (m, s) => {
      return scope[s];
    });
  }

}

module.exports.SJElement = SJElement;

