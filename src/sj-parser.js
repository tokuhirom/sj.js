// See https://tomcopeland.blogs.com/EcmaScript.html

// TODO null undefined string literal

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
    return this.logical_or();
  }

  logical_or() {
    return this.binop('logical_and', /^(\|\|)/);
  }

  logical_and() {
    return this.binop('bitwise_or', /^(&&)/);
  }

  bitwise_or() {
    return this.binop('bitwise_xor', /^(\|)[^|]/);
  }

  bitwise_xor() {
    return this.binop('bitwise_and', /^(\^)[^^]/);
  }

  bitwise_and() {
    return this.binop('equality', /^(\&)[^&]/);
  }

  equality() {
    return this.binop('relational', /^(===|==|!==|!=)/);
  }

  relational() {
    return this.binop('shift', /^(<=|>=|>|<|instanceof|in)/);
  }

  shift() {
    return this.binop('additive', /^(>>>|>>|<<)/);
  }

  additive() {
    return this.binop('multiplicative', /^(\+|\-)/);
  }

  multiplicative() {
    return this.binop('unary', /^(\*|\/|\%)/);
  }

  unary() {
    let m = [];
    while (true) {
      const unary_op = this.token(["+", "-", "~", "!"]);
      if (!unary_op) {
        break;
      }
      m.push(unary_op);
    }

   let expr = this.postfix();
   if (!expr) {
     return;
   }
   for (const p of m) {
     expr = [p, expr];
   }
   return expr;
  }

  postfix() {
    return this.left_hand_side();
  }

  // CallExpression ::= MemberExpression Arguments ( CallExpressionPart )*
  left_hand_side() {
    const member = this.member();
    if (!member) {
      return;
    }

    const arguments_ = this.arguments_();
    if (!arguments_) {
      return member;
    }

    const call_expressions = [];
    while (true) {
      const c = this.call_expression();
      if (!c) {
        break;
      }
      call_expression.push(c);
    }

    return ['CALL', member, arguments_, call_expressions];
  }

  member() {
    const lhs = this.primary();
    if (!lhs) {
      return;
    }

    const member_expression_part = [];
    while (true) {
      const m = this.member_expression_part();
      if (!m) {
        break;
      }
      member_expression_part.push(m);
    }
    if (member_expression_part.length) {
      return ['MEMBER', lhs, member_expression_part];
    } else {
      return lhs;
    }
  }

  member_expression_part() {
    if (this.token('[')) {
      const expr = this.expr();
      if (!expr) {
        throw `Missing expression after '[': ${this.input}, ${this.origExpr}`;
      }

      if (!this.token(']')) {
        throw `Missing closing ']': ${this.input}, ${this.origExpr}`;
      }
      return ['[]', expr];
    }

    if (this.token('.')) {
      const ident = this.ident();
      if (!ident) {
        throw `Missing ident after dot: ${this.input}, ${this.origExpr}`;
      }
      return ['.', ident];
    }
  }

  // CallExpression ::= MemberExpression Arguments ( CallExpressionPart )*
  call_expression() {
    const arguments_ = this.arguments_();
    if (arguments_) {
      return arguments_;
    }

    if (this.token('[')) {
      const expr = this.expr();
      if (!expr) {
        throw `Missing expression after '[': ${this.input}, ${this.origExpr}`;
      }

      if (!this.token(']')) {
        throw `Missing closing ']': ${this.input}, ${this.origExpr}`;
      }
      return ['[]', expr];
    }

    if (this.token('.')) {
      const ident = this.ident();
      if (!ident) {
        throw `Missing ident after dot: ${this.input}, ${this.origExpr}`;
      }
      return ['.', ident];
    }
  }

  // Arguments  ::= "(" ( ArgumentList )? ")"
  arguments_() {
    if (this.token('(')) {
      const params = this.argument_list();
      if (!this.token(')')) {
        throw `Paren missmatch: '${this.origExpr}'`;
      }
      return params;
    } else {
      return;
    }
  }

  // params = ( expr ',' )*
  argument_list() {
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
    let term = this.ident();
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

  // term = number | ident
  primary() {
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

  binop(child, operator) {
    let lhs = this[child]();
    while (true) {
      const op = this.expect(operator);
      if (!op) {
        break;
      }

      const rhs = this[child]();
      if (!rhs) {
        throw `Missing right hand side expression after '${op}': '${this.input}', '${this.origExpr}'`;
      }
      lhs = [op, lhs, rhs];
    }
    return lhs;
  }

  expect(re) {
    const m = this.input.match(re);
    if (m) {
      this.input = this.input.substr(m[1].length);
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

