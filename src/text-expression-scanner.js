function scan(s) {
  const orig = s;
  const result = [];
  while (s.length > 0) {
    const i = s.indexOf('{{');
    if (i>=0) {
      if (i>0) { // there's prefix string
        const p = s.substr(0, i);
        result.push(JSON.stringify(p));
      }

      // find closing }}
      const l = s.indexOf('}}');
      if (l<0) {
        throw `Missing closing '}}' in expression: ${orig}`;
      }
      const exp = s.substr(i+2, l-(i+2));
      if (exp.length > 0) {
        result.push(`(${exp})`);
      }
      s=s.substr(l+2);
    } else {
      result.push(JSON.stringify(s));
      break;
    }
  }
  return result.join("+");
}

module.exports = scan;

