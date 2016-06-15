// polyfills
require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

const tag = require('./tag.js');
const Element = require('./element.js');
require('./app.js');

module.exports.Element = Element;
module.exports.tag = tag;

window.addEventListener("DOMContentLoaded", () => {
  const elems = document.querySelectorAll('[sj-app]');
  for (let i=0, l=elems.length; i<l; ++i) {
    const elem = elems[i];
    const template = document.createElement("sj-template");
    const app = elem.getAttribute('sj-app');
    template.setAttribute('sj-app', app);
    template.innerHTML = elem.innerHTML;
    elem.parentNode.replaceChild(template, elem);
    const func = window[app];
    if (func) {
      func.apply(template);
    }
  }
  customElements.define('sj-template', class extends sj.Element {
    template() { return this.innerHTML; }
  });
});
