const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const assert = require('assert');

// hack
// https://github.com/google/incremental-dom/issues/239
IncrementalDOM.attributes.value = function (el, name, value) {
  el.value = value
};

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

class SJRenderer {
  constructor() {
    assert(arguments.length === 0);
    // TODO optimize this
    this.replaceVariables = `.replace(/\{\{([$A-Za-z0-9_.\(\)-]+)\}\}/g, function (m, s) {
      return eval(s);
    }.bind(this))`;
  }

  compile(templateElement) {
    const children = templateElement.childNodes;
    let code = [];
    for (let i = 0; i < children.length; ++i) {
      code = code.concat(this.renderDOM(children[i]));
    }
    // console.log(code);
    return new Function('IncrementalDOM', code.join(";\n"));
  }

  renderDOM(elem) {
    assert(elem);
    if (elem.nodeType === Node.TEXT_NODE) {
      return `IncrementalDOM.text("${this.escape(elem.textContent)}"${this.replaceVariables})`;
    } else if (elem.nodeType === Node.COMMENT_NODE) {
      // Ignore comment node
      return '';
    }

    const headers = [];
    const footers = [];
    var body = [];

    // process `sj-if`
    {
      const cond = elem.getAttribute('sj-if');
      if (cond) {
        headers.push(`if (${cond}) {`);
        footers.push(`}`);
      }
    }

    // process `sj-repeat`
    {
      const cond = elem.getAttribute('sj-repeat');
      if (cond) {
        const m = cond.match(/^\s*(\w+)\s+in\s+([a-z][a-z0-9.]+)\s*$/);
        if (!m) {
          throw `Invalid sj-repeat value: ${attr.value}`;
        }

        const varName = m[1];
        const container = m[2];

        // TODO support (x,i) in bar
        headers.push(`(function(IncrementalDOM) {\nvar $container=${container};\nfor (var $index=0,$l=$container.length; $index<$l; $index++) {\nvar ${varName}=$container[$index];`);
        footers.push(`}\n}).apply(this, [IncrementalDOM]);`);
      }
    }

    const tagName = elem.tagName.toLowerCase();

    // process attributes
    body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
    body = body.concat(this.renderAttributes(elem));
    body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);

    const children = elem.childNodes;
    for (let i = 0, l = children.length; i < l; ++i) {
      const child = children[i];
      if (child.nodeType === Node.TEXT_NODE) {
        // replaceVariables
        body.push(`IncrementalDOM.text("${this.escape(child.textContent)}"${this.replaceVariables})`);
      } else {
        body = body.concat(this.renderDOM(child));
      }
    }
    body.push(`IncrementalDOM.elementClose("${tagName}")`);

    const retval = [';'].concat(headers).concat(body).concat(footers);
    // console.log(`DONE renderDOM ${JSON.stringify(retval)}`);
    return retval;
  }

  renderAttributes(elem, lexVarNames, lexVarValues) {
    const attrs = elem.attributes;
    const codeList = [];
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      const code = this.renderAttribute(attrs[i]);
      codeList.push(code);
    }
    // console.log(`DONE renderAttributes ${JSON.stringify(codeList)}`);
    return codeList;
  }

  renderAttribute(attr) {
    // console.log(`renderAttribute: ${attr.name}=${attr.value}`);

    const attrName = attr.name;
    if (attrName.substr(0,3) === 'sj-') {
      const event = sj_attr2event[attrName];
      if (event) {
        const expression = attr.value;
        return `
          IncrementalDOM.attr("${event}", function ($event) {
            ${expression};
          }.bind(this));
        `;
      } else if (attr.name === 'sj-model') {
        return `
          IncrementalDOM.attr("value", ${attr.value});
          IncrementalDOM.attr("onchange", function ($event) {
            ${attr.value} = $event.target.value;
            this.update();
          }.bind(this));
        `;
      } else if (sj_boolean_attributes[attr.name]) {
        const attribute = sj_boolean_attributes[attr.name];
        const expression = attr.value;
        return `if (${expression}) { IncrementalDOM.attr("${attribute}", "${attribute}"); }`;
      }
      return '';
    } else {
      return `IncrementalDOM.attr("${attr.name}", "${this.escape(attr.value)}"${this.replaceVariables});`;
    }
  }

  escape(s) {
    return s.replace(/\n/g, function (m) {
      return "\\n";
    });
  }
}

module.exports = SJRenderer;

