const Compiler = require('./compiler');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');
const Aggregator = require('./aggregator.js');
const Element = require('./element.js');

var unwrapComment = /\/\*!?(?:\@preserve)?[ \t]*(?:\r\n|\n)([\s\S]*?)(?:\r\n|\n)\s*\*\//;

const knownOpts = [
  'template',
  'accessors',
  'default',
  'events',
  'initialize',
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

    prepare(scope) {
      for (const key in opts.default) {
        scope[key] = opts.default[key];
      }
    }

    initialize() {
      // set event listeners
      if (opts.events) {
        for (const event in opts.events) {
          this.addEventListener(event, opts.events[event].bind(this));
        }
      }
      if (opts.initialize) {
        opts.initialize.apply(this);
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

