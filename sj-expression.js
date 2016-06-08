(function (root) {
  const trace = function (msg) {
    // console.log(msg);
  };

  function _get(scope, path, origPath) {
    if (!scope) {
      return;
    }

    trace(`_get: ${path}`);
    const m = path.match(/^([a-zA-Z][a-zA-Z0-9_-]*)($|\.|\(\))(.*)/);
    if (m) {
      if (m[2]) {
        if (m[2] === '.') {
          trace(`hit: ${m[1]}`);
          // m[2] equals '.'. We should lookup child.
          return _get(scope[m[1]], m[3], origPath);
        } else if (m[2].endsWith('()')) {
          trace(`hit: ${m}`);
          return scope[m[1]]();
        } else {
          throw "Should not reach here";
        }
      } else {
        trace('hit');
        return scope[m[1]];
      }
    } else {
      throw "Invalid path: " + origPath + " : " + path;
    }
  }

  function getValueByPath(scope, path) {
    if (!path) {
      throw "Missing path";
    }
    trace(`getValueByPath: ${path}`);
    return _get(scope, path, path);
  }

  const sjExpression = {
    getValueByPath: getValueByPath
  };

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = sjExpression
    }
    exports.sjExpression = sjExpression
  }
  else {
    root.sjExpression = sjExpression
  }
})(this);
