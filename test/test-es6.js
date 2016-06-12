var test = require('tape');
var sj = require('../src/main.js');

test('es6', t => {
  customElements.define('test-es6', class extends sj.Element {
    template() {
      return `<input type="text" sj-model="this.filter" value="hoge">`;
    }
  });

  const elem = document.createElement('test-es6');
  t.equal(elem.filter, 'hoge');
});

