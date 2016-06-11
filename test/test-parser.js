const Parser = require('../src/sj-parser.js');
const test = require('tape');

const cases = [
  ['x', ['IDENT', 'x']],
  ['x.y', [ '.', [[ 'IDENT', 'x' ], [ 'IDENT', 'y' ]] ]],
  ['x.y.z', [ '.', [ [ 'IDENT', 'x' ], [ 'IDENT', 'y' ], [ 'IDENT', 'z' ] ] ]],
  ['$x', ['IDENT', '$x']],
  ['x()', [ 'FUNCALL', [ 'IDENT', 'x' ], [] ]],
  ['x(y)', [ 'FUNCALL', [ 'IDENT', 'x' ], [ [ 'IDENT', 'y' ] ] ]],
  ['x.y(3,5)', [ 'FUNCALL', [ '.', [ [ 'IDENT', 'x' ], [ 'IDENT', 'y' ] ] ], [ [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ] ]],
  ['add(3,5)', [ 'FUNCALL', [ 'IDENT', 'add' ], [ [ 'NUMBER', '3' ], [ 'NUMBER', '5' ] ] ]],
];

for (const c of cases) {
  const [expr, expected, debug] = c;
  test(expr, t => {
    t.plan(1);
    const parser = new Parser(expr);
    parser.debug = debug;
    const got = parser.parse();
    t.deepEqual(got, expected, expr);
  });
}
