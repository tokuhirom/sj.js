(function (global) {
  const trace = function (msg) {
    // console.log(msg);
  };

  function parseLeaf(scope, path, origPath) {
    const m = path.match(/^([a-zA-Z][a-zA-Z0-9_-]*)(.*)$/);
    if (m) {
      const [ident, rest] = [m[1], m[2]];
      trace(`rest: ${rest}`);
      return [scope[ident], rest];
    } else {
      return;
    }
  }

  // namespace = ( ident '.' )? ident
  function parsePath(scope, path, origPath) {
    trace(`parsePath: ${path}`);
    const m = path.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\.(.*)$/);
    if (m) {
      const [namespace, rest] = [m[1], m[2]];
      trace(`parsePath: ${namespace}, ${rest}`);
      return parsePath(scope[namespace], rest, origPath);
    } else {
      return parseLeaf(scope, path, origPath);
    }
  }

  function parseNumber(scope, path, origPath) {
    const m = path.match(/^([1-9][0-9]*(?:\.[0-9]+)?)(.*)$/);
    if (m) {
      trace(`parseNumber: ${path}. ${m}. ok`);
      return [parseFloat(m[1], 10), m[2]];
    } else {
      trace(`parseNumber: ${path}. fail`);
      return;
    }
  }

  function parseTerm(scope, path, origPath) {
    const m = parsePath(scope, path, origPath);
    if (m) {
      return m;
    }
    return parseNumber(scope, path, origPath);
  }

  function parseParams(scope, path, origPath) {
    if (!path.startsWith('(')) {
      return;
    }
    path = path.substr(1);

    const params = [];
    while (true) {
      const m = parseFuncall(scope, path, origPath);
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
  throw `Paren missmatch: '${path}': '${origPath}'`;
}
path = path.substr(1);
path = path.replace(/^\s*/, '');
if (path.length > 0) {
  throw `There's trailing trash: ${origPath}`;
}

return [params, path];
  }

  function parseFuncall(scope, path, origPath) {
    if (!path) {
      throw "Missing path";
    }
    const m = parseTerm(scope, path, origPath);
    if (!m) {
      return;
    }
    const [got, rest] = m;
    if (rest) {
      trace(`got:${got}, ${rest}`);
      const m = parseParams(scope, rest, origPath);
      if (m) {
        trace(`apply: ${rest}`);
        return [got.apply(undefined, m[0]), m[1]];
      } else {
        return [got, rest];
      }
    } else {
      return [got, rest];
    }
  }

  function getValueByPath(scope, path) {
    if (!path) {
      throw "Missing path";
    }
    trace(`getValueByPath: ${path}`);
    const m = parseFuncall(scope, path, path);
    if (m) {
      if (m[1]) {
        throw `Trailing trash: '${m[1]}' in '${path}'`;
      } else {
        return m[0];
      }
    } else {
    }
  }


  global.sjExpression = {
    getValueByPath: getValueByPath
  };
})(typeof global !== 'undefined' ? global : window);
