const Compiler = require('./compiler');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const Aggregator = require('./aggregator.js');
const Element = require('./element.js');
const objectAssign = require('object-assign');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

const knownOpts = [
  'template',
  'accessors',
  'default',
  'events',
  'initialize',
  'attributes',
  'methods'
];
const knownOptMap = {};
knownOpts.forEach(e => {
  knownOptMap[e] = e;
});

function tag(tagName, opts) {
  for (const key in opts) {
    if (!knownOptMap[key]) {
      throw `Unknown options for sj.tag: ${tagName}:${key}(Known keys: ${knownOpts})`;
    }
  }

  const defaultValue = objectAssign({}, opts.default);
  const attributes = opts.attributes || {};

  let template;

  const elementClass = class extends Element {
    template() {
      if (!template) {
        if (typeof(opts.template) === 'function') {
          template = unwrapComment.exec(opts.template.toString())[1];
        } else {
          template = opts.template;
        }
      }
      return template;
    }

    default() {
      return defaultValue;
    }

    initialize() {
      // set event listeners
      if (opts.events) {
        for (const event in opts.events) {
          this.addEventListener(event, opts.events[event].bind(this));
        }
      }
      // overwrite by attribute values
      const attrs = this.attributes;
      for (let i = 0, l = attrs.length; i < l; ++i) {
        const attr = attrs[i];
        const key = attr.name;
        if (key.substr(0, 8) !== 'sj-attr-') {
          const cb = attributes[key];
          if (cb) {
            cb.apply(this, [attr.value]);
          }
        }
      }
      if (opts.initialize) {
        opts.initialize.apply(this);
      }
    }

    attributeChangedCallback(key) {
      if (key.substr(0, 8) === 'sj-attr-') {
        return;
      }

      const cb = attributes[key];
      if (cb) {
        cb.apply(this, [this.getAttribute(key)]);
        this.update();
      }
    }
  };

  if (opts.methods) {
    for (const name in opts.methods) {
      elementClass.prototype[name] = opts.methods[name];
    }
  }

  if (opts.accessors) {
    for (const name in opts.accessors) {
      Object.defineProperty(elementClass.prototype, name, {
        get: opts.accessors[name].get,
        set: opts.accessors[name].set
      });
    }
  }

  customElements.define(tagName, elementClass);
}

module.exports = tag;

