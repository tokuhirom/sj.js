const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
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
  'sj-change': 'onchange',
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
      return [`IncrementalDOM.text(${this.text(elem.textContent)})`];
    } else if (elem.nodeType === Node.COMMENT_NODE) {
      // Ignore comment node
      return [];
    }

    const tagName = elem.tagName.toLowerCase();

    // process `sj-if`
    {
      const cond = elem.getAttribute('sj-if');
      if (cond) {
        var body = [';'];
        body.push(`if (${cond}) {`);
        body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
        body = body.concat(this.renderAttributes(elem, vars));
        body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);

        body = body.concat(this.renderBody(elem, vars));

        body.push(`IncrementalDOM.elementClose("${tagName}")`);

        body.push(`}`);
        return body;
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
          // varName in container
          const varName = m[1];
          const container = m[4];

          var body = [';'];
          body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
          body = body.concat(this.renderAttributes(elem, vars));
          body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);

          body.push(`(function(IncrementalDOM) {\nvar $$container=${container};\nfor (var $index=0,$l=$$container.length; $index<$l; $index++) {\nvar ${varName}=$$container[$index];`);

          body = body.concat(this.renderBody(elem, vars.concat([varName, '$index'])));

          body.push(`}\n}).apply(this, [IncrementalDOM]);`);
          body.push(`IncrementalDOM.elementClose("${tagName}")`);

          return body;
        } else {
          // (keyName, varName) in container
          const keyName = m[2];
          const valueName = m[3];
          const container = m[4];
          var body = [';'];
          body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
          body = body.concat(this.renderAttributes(elem, vars));
          body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);
          body.push(`(function(IncrementalDOM) {\nvar $$container=${container};for (var ${keyName} in $$container) {\nvar ${valueName}=$$container[${keyName}];`);
          body = body.concat(this.renderBody(elem, vars.concat([keyName, valueName])));
          body.push(`}\n}).apply(this, [IncrementalDOM]);`);
          body.push(`IncrementalDOM.elementClose("${tagName}")`);
          return body;
        }
      }
    }

    // process attributes
    var body = [';'];
    body.push(`IncrementalDOM.elementOpenStart("${tagName}")`);
    body = body.concat(this.renderAttributes(elem, vars));
    body.push(`IncrementalDOM.elementOpenEnd("${tagName}")`);
    body = body.concat(this.renderBody(elem, vars));
    body.push(`IncrementalDOM.elementClose("${tagName}")`);

    return body;
  }

  renderBody(elem, vars) {
    let body = [];
    const bind = elem.getAttribute('sj-bind');
    const tagName = elem.tagName.toLowerCase();
    if (tagName.indexOf('-') >= 0) {
      body.push(`IncrementalDOM.skip()`);
    } else if (bind) {
      body.push(`IncrementalDOM.text(${bind});`);
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
    return body;
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
            ${model} = $event.target.checked;
            ${code};
            this.update();
          }.bind(${['this'].concat(vars).join(",")}));
        `);
      } else {
        normalEvents.push('onchange');
        const code = events['oninput'] || '';
        codeList.push(`
          IncrementalDOM.attr("value", ${model});
          IncrementalDOM.attr("oninput", function (${vars.concat(['$event']).join(",")}) {
            ${model} = $event.target.value;
            ${code};
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
      } else if (attr.name === 'sj-href') {
        return `IncrementalDOM.attr("href", ${attr.value}.replace(/^[^:]+?:/, function (scheme) { return (scheme === 'http:' || scheme === 'https://') ? scheme : 'unsafe:' + scheme }));`;
      } else if (attr.name.substr(0,8) === 'sj-attr-') {
        return `IncrementalDOM.attr(${JSON.stringify(attr.name.substr(8))}, ${attr.value});`;
      } else {
        return '';
      }
    } else {
      return `IncrementalDOM.attr("${attr.name}", ${this.text(attr.value)});`;
    }
  }

  text(s) {
    return JSON.stringify(s);
  }
}

module.exports = Compiler;

