// polyfills
require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

const sj = require('./sj.js');
const es5 = require('./sj-es5.js');

module.exports.Element = sj.SJElement;
module.exports.tag = es5.sjtag;
