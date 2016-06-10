// polyfill
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if (!String.prototype.startsWith) {
String.prototype.startsWith = function(searchString, position){
  position = position || 0;
  return this.substr(position, searchString.length) === searchString;
};
  }

  const trace = function (msg) {
    // console.log(msg);
  };

  class Parser {
    constructor(origPath, self) {
      this.origPath = origPath;
      this.self = self;
    }

    parseLeaf(scope, path) {
      const m = path.match(/^([$a-zA-Z][a-zA-Z0-9_-]*)(.*)$/);
      if (m) {
        const [ident, rest] = [m[1], m[2]];
        trace(`rest: ${rest}`);
        return [scope[ident], rest];
      } else {
        return;
      }
    }

    // namespace = ( ident '.' )? ident
    parsePath(scope, path) {
      trace(`parsePath: ${path}`);
      const m = path.match(/^([$a-zA-Z][a-zA-Z0-9_-]*)\.(.*)$/);
      if (m) {
        const [namespace, rest] = [m[1], m[2]];
        trace(`parsePath: ${namespace}, ${rest}`);
        return this.parsePath(scope[namespace], rest);
      } else {
        return this.parseLeaf(scope, path);
      }
    }

    parseNumber(scope, path) {
      const m = path.match(/^([1-9][0-9]*(?:\.[0-9]+)?)(.*)$/);
      if (m) {
        trace(`parseNumber: ${path}. ${m}. ok`);
        return [parseFloat(m[1], 10), m[2]];
      } else {
        trace(`parseNumber: ${path}. fail`);
      }
    }

    parseTerm(scope, path) {
      const m = this.parsePath(scope, path);
      if (m) {
        return m;
      }
      return this.parseNumber(scope, path);
    }

    parseParams(scope, path) {
      if (!path.startsWith('(')) {
        return;
      }
      path = path.substr(1);

      const params = [];
      while (true) {
        const m = this.parseFuncall(scope, path);
        if (!m) {
          trace(`No param: '${path}'`);
          break;
        }
        path = m[1];
        trace(`Got param: '${m}'`);
        params.push(m[0]);

        path = path.replace(/^\s*/, '');
if (!path.startsWith(',')) {
  trace(`No more comma. break. ${path}`);
  break;
}
path = path.substr(1);
path = path.replace(/^\s*/, '');
      }

      path = path.replace(/^\s*/, '');
if (!path.startsWith(')')) {
  throw `Paren missmatch: '${path}': '${this.origPath}'`;
}
path = path.substr(1);
path = path.replace(/^\s*/, '');
if (path.length > 0) {
  throw `There's trailing trash: ${this.origPath}`;
}

return [params, path];
    }

    parseFuncall(scope, path) {
      if (!path) {
        throw "Missing path";
      }
      const m = this.parseTerm(scope, path);
      if (!m) {
        return;
      }
      const [got, rest] = m;
      if (rest) {
        trace(`got:${got}, ${rest}`);
        const m = this.parseParams(scope, rest);
        if (m) {
          trace(`apply: ${rest}`);
          return [got.apply(this.self, m[0]), m[1]];
        } else {
          return [got, rest];
        }
      } else {
        return [got, rest];
      }
    }
  }

  function getValueByPath(scope, path, self) {
    if (!path) {
      throw "Missing path";
    }
    trace(`getValueByPath: ${path}`);
    const parser = new Parser(path, self);
    const m = parser.parseFuncall(scope, path, path);
    if (m) {
      if (m[1]) {
        throw `Trailing trash: '${m[1]}' in '${path}'`;
      } else {
        return m[0];
      }
    } else {
      throw `Cannot parse expression: '${path}'`;
    }
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

