// polyfills
require('webcomponents.js/CustomElements.js');
require('./polyfill.js');
require('whatwg-fetch/fetch.js');

const tag = require('./tag.js');
const Element = require('./element.js');
require('./app.js');

module.exports.Element = Element;
module.exports.tag = tag;
module.exports.fireEvent = require('./fire-event.js');

