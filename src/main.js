// polyfills
require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

const tag = require('./sj-tag.js');
const elem = require('./sj-element.js');

module.exports.Element = elem.SJElement;
module.exports.tag = tag.sjtag;
