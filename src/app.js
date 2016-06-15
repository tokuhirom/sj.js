const Compiler = require('./compiler.js');
const Aggregator = require('./aggregator.js');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

window.addEventListener("DOMContentLoaded", () => {
  const elems = document.querySelectorAll('[sj-app]');
  for (let i=0, l=elems.length; i<l; ++i) {
    const elem = elems[i];

    const template = document.createElement("div");

    // copy attributes
    const attributes = elem.attributes;
    for (let i=0, l=attributes.length; i<l; i++) {
      const attr = attributes[i];
      template.setAttribute(attr.name, attr.value);
    }

    new Aggregator(elem).aggregate(template);
    const compiled = new Compiler().compile(elem);
    template.update = function () {
      IncrementalDOM.patch(this, () => {
        compiled.apply(this, [IncrementalDOM]);
      });
    };

    const app = elem.getAttribute('sj-app');
    const replaced = elem.parentNode.replaceChild(template, elem);
    if (app) {
      const func = window[app];
      if (func) {
        func.apply(template);
        template.update();
      } else {
        throw `Unknown function '${app}', specefied by sj-app`;
      }
    }
  }
});

