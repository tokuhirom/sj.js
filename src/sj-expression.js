const trace = function (msg) {
  console.log(msg);
};

function parseTerm(scope, path, origPath) {
  const m = path.match(/^([a-zA-Z][a-zA-Z0-9_-]*)(.*)$/);
  if (m) {
    const [ident, rest] = [m[1], m[2]];
    trace(`rest: ${rest}`);
    return [scope[ident], rest];
  } else {
    throw "Invalid path: " + origPath + " : " + path;
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
    return parseTerm(scope, path, origPath);
  }
}

function parseFuncall(scope, path, origPath) {
  if (!path) {
    throw "Missing path";
  }
  const [got, rest] = parsePath(scope, path, origPath);
  if (rest) {
    trace(`got:${got}, ${rest}`);
    if (rest === '()') {
      return got();
    }
  } else {
    return got;
  }
}

function getValueByPath(scope, path) {
  if (!path) {
    throw "Missing path";
  }
  trace(`getValueByPath: ${path}`);
  return parseFuncall(scope, path, path);
}


module.exports = {
    getValueByPath: getValueByPath
};
