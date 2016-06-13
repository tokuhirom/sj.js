const scan = require('../src/text-expression-scanner.js');
const test = require('tape');

test('scan', t => {
    t.plan(1);
    const get = scan('aaa{{bbb}}ccc{{ddd}}');
    t.equal(get, '"aaa"+(bbb)+"ccc"+(ddd)');
});

