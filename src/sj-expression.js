require('String.prototype.startsWith');
const Parser = require('./sj-parser.js');

function getDot(scope, items) {
  let retval;
  for (const item of items) {
    retval = scope[item];
    scope = scope[item];
    if (!retval) {
      return;
    }
  }
  return retval;
}

class Expression {
  constructor(code) {
    if (!code) {
      throw "Missing code";
    }
    this.code = code;
  }

  static compile(expr) {
    const code = new Compiler().compile(expr);
    return new Expression(code);
  }

  apply(scope, self) {
    return this.code.apply(self, [scope, getDot]);
  }
}

class Compiler {
  constructor() {
  }

  compile(expr) {
    const parser = new Parser(expr);
    const node = parser.parse();
    const code = this._compile(node);
    return new Function('$scope', 'getDot', 'return ' + code);
  }

  _compile(node) {
    switch (node[0]) {
      case 'IDENT':
        return '$scope.' + node[1];
      case 'NUMBER':
        return node[1];
      case '.':
        return 'getDot($scope, [' + node[1].map(e => `"${e[1]}"`).join(",") + "])";
      case 'FUNCALL':
        return this._compile(node[1]) + '.apply(this, [' + node[2].map(e => this._compile(e)) + '])';
      default:
        throw "Unknown node: " + node[0];
    }
  }
}

function getValueByPath(scope, expr, self) {
  const e = Expression.compile(expr);
  return e.apply(scope, self);
}

function setValueByPath(scope, path, value) {
  while (true) {
    const m = path.match(/^([$a-zA-Z][a-zA-Z0-9_-]*)\.(.*)$/);
    if (m) {
      const namespace = m[1];
      scope = scope[namespace];
      path = m[2];
    } else {
      break;
    }
  }
  scope[path] = value;
}

module.exports.Expression = Expression;
module.exports.getValueByPath = getValueByPath;
module.exports.setValueByPath = setValueByPath;

