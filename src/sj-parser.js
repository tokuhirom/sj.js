// See https://tomcopeland.blogs.com/EcmaScript.html

class Parser {
  constructor(expr) {
    this.origExpr = expr;
    this.input = expr;
  }

  parse() {
    const expr = this.expr();
    if (!expr) {
      throw `Parse failed: '${this.origExpr}'`;
    }
    if (this.input) {
      throw `Parse failed: ${this.input}`;
    }
    return expr;
  }

  expr() {
    return this.not();
  }

  // not = '!'? funcall
  not() {
    if (this.token('!')) {
      const funcall = this.funcall();
      if (funcall) {
        return ['!', funcall];
      }
    } else {
      return this.funcall();
    }
  }

  // funcall = dot '(' params ')'
  funcall() {
    const term = this.dot();
    if (!term) {
      return;
    }

    if (this.token('(')) {
      const params = this.params();
      if (!this.token(')')) {
        throw `Paren missmatch: '${this.origExpr}'`;
      }
      return ['FUNCALL', term, params];
    } else {
      return term;
    }
  }

  // params = ( expr ',' )*
  params() {
    const params = [];
    while (true) {
      const expr = this.expr();
      if (!expr) {
        break;
      }
      params.push(expr);

      if (!this.token(',')) {
        break;
      }
    }
    return params;
  }

  // dot = term '.' ident
  //     = term
  dot() {
    let term = this.additive();
    if (this.token('.')) {
      const terms = [term];
      while (true) {
        const rhs = this.ident();
        if (!rhs) {
          throw `Invalid token after dot: '${this.input}', '${this.origExpr}'`;
        }
        terms.push(rhs);
        if (!this.token('.')) {
          return ['.', terms];
        }
      }
    } else {
      return term;
    }
  }

  // additive = multiplicative ( [ '+' | '-' ] multiplicative )*
  additive() {
    let m = this.multiplicative();
    while (true) {
      const add = this.token(['+', '-']);
      if (!add) {
        return m;
      }
      const lhs = this.multiplicative();
      if (!lhs) {
        throw `Missing multiplicative after ${add}: ${this.origExpr}`;
      }
      m = [add, m, lhs];
    }
  }

  multiplicative() {
    return this.primary_expression();
  }

  // term = number | ident
  primary_expression() {
    const number = this.number();
    if (number) {
      return number;
    }

    const ident = this.ident();
    if (ident) {
      return ident;
    }

    if (this.token('(')) {
      const expr = this.expr();
      if (!expr) {
        throw `Missing expression after '(': ${this.origExpr}`;
      }
      if (!this.token(')')) {
        throw `Missing closing paren after '(': ${this.origExpr}`;
      }
      return expr;
    }
  }

  ident() {
    const s = this.expect(/^([$a-zA-Z][$a-zA-Z0-9_-]*)/);
    if (s) {
      return ['IDENT', s];
    }
  }

  number() {
    const number = this.expect(/^([1-9][0-9]*(?:\.[0-9]+)?)/);
    if (number) {
      return ['NUMBER', number];
    }
  }

  expect(re) {
    const m = this.input.match(re);
    if (m) {
      this.input = this.input.substr(m[0].length);
      return m[1];
    }
  }

  token(token) {
    const tokens = Array.isArray(token) ? token : [token];

    for (const token of tokens) {
      this.input = this.input.replace(/^\s*/, '');
      if (this.input.startsWith(token)) {
        this.trace(`trace match ${token}`);

        this.input = this.input.substr(token.length);
        this.input = this.input.replace(/^\s*/, '');
        return token;
      }
    }
  }

  trace(msg) {
    if (this.debug) {
      console.log(`# TRACE ${msg}`);
    }
  }
}

module.exports = Parser;

