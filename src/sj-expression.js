require('String.prototype.startsWith');
const Parser = require('./sj-parser.js');

const trace = function (msg) {
  // console.log(msg);
};

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

class Compiler {
  constructor(expr) {
    this.parser = new Parser(expr);
  }

  compile() {
    const node = this.parser.parse();
    const code = this._compile(node);
    return new Function('$scope', 'getDot', 'self', 'return ' + code);
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
        return this._compile(node[1]) + '.apply(self, [' + node[2].map(e => this._compile(e)) + '])';
      default:
        throw "Unknown node: " + node[0];
    }
  }
}

function compileExpression(expr) {
  const compiler = new Compiler(expr);
  return compiler.compile();
}

function getValueByPath(scope, expr, self) {
  const code = compileExpression(expr);
  return code.apply(self, [scope, getDot, self]);
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

module.exports.getValueByPath = getValueByPath;
module.exports.setValueByPath = setValueByPath;

