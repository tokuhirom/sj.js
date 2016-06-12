const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const assert = require('assert');

// hack
// https://github.com/google/incremental-dom/issues/239
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
};

require('String.prototype.startsWith');

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

const sj_boolean_attributes = {
  'sj-disabled': 'disabled',
  'sj-required': 'required',
  'sj-checked': 'checked'
};

function isFormElement(elem) {
  return elem instanceof HTMLInputElement
         || elem instanceof HTMLTextAreaElement
         || elem instanceof HTMLSelectElement;
}

// http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
var createFunction = (function() {
  function F(args) {
    return Function.apply(this, args);
  }
  F.prototype = Function.prototype;

  return function() {
    return new F(arguments);
  }
})();

const EVAL_CODE_CACHE = {};
function evalExpression(self, expr, lexVarNames, lexVarValues) {
  assert(arguments.length === 4);
  assert(Array.isArray(lexVarNames));
  // assert(self instanceof HTMLElement);
  // console.log(`evalExpression:${JSON.stringify(self.dump())}, ${expr}, lexVarNames:${JSON.stringify(lexVarNames)}, lexVarValues:${JSON.stringify(lexVarValues)}`);

  const cache_key = expr+"\t"+lexVarNames.join("\t");
  if (!EVAL_CODE_CACHE[cache_key]) {
    EVAL_CODE_CACHE[cache_key] = createFunction.apply(null, lexVarNames.concat([`return ${expr}`]));
  }
  return EVAL_CODE_CACHE[cache_key].apply(self, lexVarValues);
}

const SET_CODE_CACHE = {};
function setValueByPath(self, expression, value) {
  assert(arguments.length === 3);
  // assert(self instanceof HTMLElement);
  // console.log(`setValueByPath: ${self}, ${expression}, ${value}`);

  if (!SET_CODE_CACHE[expression]) {
    SET_CODE_CACHE[expression] = new Function('$value', `${expression}=$value`);
  }
  SET_CODE_CACHE[expression].apply(self, [value]);
}

class RepeatRenderer {
  // forRenderer = new RepeatRenderer(this, this.targetElement, e, container, scope, varName);
  constructor(renderer, targetElement, element, container, varName, lexVarNames, lexVarValues) {
    assert(Array.isArray(lexVarNames));
    assert(Array.isArray(lexVarValues));
    this.renderer = renderer;
    this.targetElement = targetElement;
    this.element = element;
    this.container = container;
    this.varName = varName;
    this.lexVarNames = lexVarNames;
    this.lexVarValues = lexVarValues;
  }

  render() {
    const container = evalExpression(this.targetElement, this.container, this.lexVarNames, this.lexVarValues);
    for (let i=0, l=container.length; i<l; i++) {
      const item = container[i];

      this.renderer.renderDOM(
        this.element,
        this.lexVarNames.concat(['$index', this.varName]),
        this.lexVarValues.concat([i, item]));
    }
  }
}

class SJRenderer {
  constructor(targetElement, templateElement) {
    assert(arguments.length === 2);
    this.targetElement = targetElement;
    this.templateElement = templateElement;
  }

  render() {
    if (this.rendering) {
      return;
    }

    try {
      this.rendering = true;

      IncrementalDOM.patch(this.targetElement, () => {
        const children = this.templateElement.children;
        for (let i = 0; i < children.length; ++i) {
          this.renderDOM(children[i], [], []);
        }
      });
    } finally {
      this.rendering = false;
    }
  }

  renderDOM(elem, lexVarNames, lexVarValues) {
    assert(arguments.length === 3);
    if (elem.nodeType === Node.TEXT_NODE) {
      IncrementalDOM.text(this.replaceVariables(elem.textContent, lexVarNames, lexVarValues));
      return;
    }
    if (this.shouldHideElement(elem, lexVarNames, lexVarValues)) {
      return;
    }

    const tagName = elem.tagName.toLowerCase();

    IncrementalDOM.elementOpenStart(tagName);
    const [modelName, forRenderer] = this.renderAttributes(elem, lexVarNames, lexVarValues);
    const modelValue = modelName ? evalExpression(this.targetElement, modelName, lexVarNames, lexVarValues) : null;
    const isForm = isFormElement(elem);
    // console.log(`modelName:${modelName}, isForm:${isForm}, value:${modelValue}`);
    if (modelName && isForm) {
      IncrementalDOM.attr("value", modelValue);
    }
    IncrementalDOM.elementOpenEnd(tagName);
    const children = elem.childNodes;
    if (forRenderer) {
      forRenderer.render();
    } else {
      for (let i = 0, l = children.length; i < l; ++i) {
        const child = children[i];
        if (child.nodeType === Node.TEXT_NODE) {
          if (!modelName) {
            IncrementalDOM.text(this.replaceVariables(child.textContent, lexVarNames, lexVarValues));
          }
        } else {
          this.renderDOM(child, lexVarNames, lexVarValues);
        }
      }
    }
    if (modelName && modelValue && !isForm) {
      IncrementalDOM.text(modelValue);
    }
    IncrementalDOM.elementClose(tagName);
  }

  shouldHideElement(elem, lexVarNames, lexVarValues) {
    const cond = elem.getAttribute('sj-if');
    if (cond) {
      const val = evalExpression(this.targetElement, cond, lexVarNames, lexVarValues);
      if (!val) {
        return true;
      }
    }
    return false;
  }

  renderAttributes(elem, lexVarNames, lexVarValues) {
    let modelName;
    const attrs = elem.attributes;
    let forRenderer;
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      const attrName = attr.name;
      const [hasModelAttribute, gotRepeatRenderer] = this.renderAttribute(attrName, attr, elem, lexVarNames, lexVarValues);
      if (hasModelAttribute) {
        modelName = attr.value;
      }
      if (gotRepeatRenderer) {
        forRenderer = gotRepeatRenderer;
      }
    }
    return [modelName, forRenderer];
  }

  renderAttribute(attrName, attr, elem, lexVarNames, lexVarValues) {
    let isModelAttribute;
    let forRenderer;
    if (attrName.startsWith('sj-')) {
      const event = sj_attr2event[attrName];
      if (event) {
        const expression = attr.value;
        IncrementalDOM.attr(event, (e) => {
          evalExpression(
            this.targetElement,
            expression,
            lexVarNames.concat(['$event']),
            lexVarValues.concat([e]));
        });
      } else if (attr.name === 'sj-model') {
        isModelAttribute = attr.value;
        IncrementalDOM.attr("onchange", (e) => {
          setValueByPath(this.targetElement, attr.value, e.target.value);
          this.render();
        });
      } else if (attr.name === 'sj-repeat') {
        // TODO support (x,i) in bar
        const m = attr.value.match(/^\s*(\w+)\s+in\s+([a-z][a-z0-9.]+)\s*$/);
        if (!m) {
          throw `Invalid sj-repeat value: ${attr.value}`;
        }

        const varName = m[1];
        const container = m[2];

        const e = elem.querySelector('*');
        forRenderer = new RepeatRenderer(this, this.targetElement, e, container, varName, lexVarNames, lexVarValues);
      } else if (sj_boolean_attributes[attr.name]) {
        const attribute = sj_boolean_attributes[attr.name];
        const expression = attr.value;
        const result = evalExpression(this.targetElement, expression, lexVarNames, lexVarValues);
        if (result) {
          IncrementalDOM.attr(attribute, attribute);
        }
      }
    } else {
      const labelValue = this.replaceVariables(attr.value, lexVarNames, lexVarValues);
      IncrementalDOM.attr(attr.name, labelValue);
    }
    return [isModelAttribute, forRenderer];
  }

  replaceVariables(label, lexVarNames, lexVarValues) {
    assert(arguments.length === 3);
    return label.replace(/\{\{([$A-Za-z0-9_.-]+)\}\}/g, (m, s) => {
      if (s === '$_') {
        return JSON.stringify(this.targetElement);
      } else {
        return evalExpression(this.targetElement, s, lexVarNames, lexVarValues);
      }
    });
  }

}

class SJAggregater {
  constructor(element) {
    this.element = element;
  }

  aggregate(scope) {
    const elems = this.element.querySelectorAll('input,select,textarea');
    for (let i=0, l=elems.length; i<l; ++i) {
      const val = elems[i].value;
      if (val) {
        const modelName = elems[i].getAttribute('sj-model');
        setValueByPath(scope, modelName, val);
      }
    }
  }
}

module.exports.SJRenderer = SJRenderer;
module.exports.SJAggregater = SJAggregater;

