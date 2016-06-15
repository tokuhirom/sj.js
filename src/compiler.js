const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const scan = require('./text-expression-scanner.js');
const assert = val => { };

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

class Compiler {
  constructor() {
    assert(arguments.length === 0);
  }

  compile(templateElement) {
    const children = templateElement.childNodes;
    let code = [];
    for (let i = 0; i < children.length; ++i) {
      code = code.concat(this.renderDOM(children[i], []));
    }
    // console.log(code.join(";\n"));
    return new Function('IncrementalDOM', code.join(";\n"));
  }

  renderDOM(elem, vars) {
    assert(elem);
    assert(vars);
    if (elem.nodeType === Node.TEXT_NODE) {
      return `IncrementalDOM.text(${this.text(elem.textContent)})`;
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
        const m = cond.match(/^\s*(?:(\w+)|\(\s*(\w+)\s*,\s*(\w+)\s*\))\s+in\s+([a-z][a-z0-9.]*)\s*$/);
        if (!m) {
          throw `Invalid sj-repeat value: ${cond}`;
        }

        if (m[1]) {
          const varName = m[1];
          const container = m[4];

          headers.push(`(function(IncrementalDOM) {\nvar $$container=${container};\nfor (var $index=0,$l=$$container.length; $index<$l; $index++) {\nvar ${varName}=$$container[$index];`);
          footers.push(`}\n}).apply(this, [IncrementalDOM]);`);

          vars = vars.concat([varName, '$index']);
        } else {
          const keyName = m[2];
          const valueName = m[3];
          const container = m[4];
          headers.push(`(function(IncrementalDOM) {\n$$container=${container};for (var ${keyName} in $$container) {\nvar ${valueName}=$$container[${keyName}];`);
          footers.push(`}\n}).apply(this, [IncrementalDOM]);`);
          vars = vars.concat([keyName, valueName]);
        }
      }
    }

    const tagName = elem.tagName.toLowerCase();

    // process attributes
    body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
    body = body.concat(this.renderAttributes(elem, vars));
    body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);

    if (tagName.indexOf('-') >= 0) {
      body.push(`IncrementalDOM.skip()`);
    } else {
      const children = elem.childNodes;
      for (let i = 0, l = children.length; i < l; ++i) {
      const child = children[i];
      if (child.nodeType === Node.TEXT_NODE) {
        // replaceVariables
        body.push(`IncrementalDOM.text(${this.text(child.textContent)})`);
      } else {
        body = body.concat(this.renderDOM(child, vars));
      }
      }
    }
    body.push(`IncrementalDOM.elementClose("${tagName}")`);

    const retval = [';'].concat(headers).concat(body).concat(footers);
    // console.log(`DONE renderDOM ${JSON.stringify(retval)}`);
    return retval;
  }

  renderAttributes(elem, vars) {
    assert(vars);
    const attrs = elem.attributes;
    const codeList = [];
    const model = elem.getAttribute('sj-model');
    const events = {};
    for (let i = 0, l = attrs.length; i < l; ++i) {
      const attr = attrs[i];
      const code = this.renderAttribute(elem, attrs[i], vars, events);
      codeList.push(code);
    }

    const normalEvents = [
      'onclick',
      'onblur',
      'onchecked',
      'ondblclick',
      'onfocus',
      'onkeydown',
      'onkeypress',
      'onkeyup',
      'onmousedown',
      'onmouseenter',
      'onmouseleave',
      'onmousemove',
      'onmouseover',
      'onmouseup',
      'onpaste',
      'onselected',
      'onchange',
      'onsubmit'
    ];
    if (model) {
      if (elem.type === 'checkbox' || elem.type === 'radio') {
        normalEvents.push('oninput');
        const code = events['onchange'] || '';
        codeList.push(`
          if (${model}) {
            IncrementalDOM.attr("checked", 'checked');
          }
          IncrementalDOM.attr("onchange", function (${vars.concat(['$event']).join(",")}) {
            ${code};
            ${model} = $event.target.checked;
            this.update();
          }.bind(${['this'].concat(vars).join(",")}));
        `);
      } else {
        normalEvents.push('onchange');
        const code = events['oninput'] || '';
        codeList.push(`
          IncrementalDOM.attr("value", ${model});
          IncrementalDOM.attr("oninput", function (${vars.concat(['$event']).join(",")}) {
            ${code};
            ${model} = $event.target.value;
            this.update();
          }.bind(${['this'].concat(vars).join(",")}));
        `);
      }
    }
    for (let i=0, l=normalEvents.length; i<l; i++) {
      const eventName = normalEvents[i];
      const expression = events[eventName];
      if (expression) {
        codeList.push(`;
        IncrementalDOM.attr("${eventName}", function (${vars.concat(['$event']).join(",")}) {
          ${expression};
        }.bind(${['this'].concat(vars).join(",")}));`);
      }
    }

    // console.log(`DONE renderAttributes ${JSON.stringify(codeList)}`);
    return codeList;
  }

  renderAttribute(elem, attr, vars, events) {
    assert(vars);
    // console.log(`renderAttribute: ${attr.name}=${attr.value}`);

    const attrName = attr.name;
    if (attrName.substr(0,3) === 'sj-') {
      const event = sj_attr2event[attrName];
      if (event) {
        const expression = attr.value;
        events[event] = expression;
        return '';
      } else if (sj_boolean_attributes[attr.name]) {
        const attribute = sj_boolean_attributes[attr.name];
        const expression = attr.value;
        return `if (${expression}) { IncrementalDOM.attr("${attribute}", "${attribute}"); }`;
      } else if (attr.name === 'sj-class') {
        return `IncrementalDOM.attr("class", ${attr.value}.join(" "));`;
      } else if (attr.name === 'sj-style') {
        return `IncrementalDOM.attr("style", ${attr.value});`;
      } else {
        return '';
      }
    } else {
      if (attr.name === 'href') {
        return `IncrementalDOM.attr("${attr.name}", ${this.text(attr.value)}.replace(/^[^:]+?:/, function (scheme) { return (scheme === 'http:' || scheme === 'https://') ? scheme : 'unsafe:' + scheme }));`;
      } else {
        if ((attr.name.substr(0, 2) === 'on') && (attr.value =~ /\{\{/)) {
          throw `You can't include {{}} expression in event handler(Security reason). You should use sj-* instead.`;
        }
        return `IncrementalDOM.attr("${attr.name}", ${this.text(attr.value)});`;
      }
    }
  }

  text(s) {
    return scan(s);
  }
}

module.exports = Compiler;

