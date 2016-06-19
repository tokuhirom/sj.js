var test = require('tape');
var Compiler = require('../src/compiler');
const IncrementalDOM = require('incremental-dom/dist/incremental-dom.js');

test('foo', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = '<div id="foo"></div>';
  const code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () { };
  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });
  t.equal(target.querySelector('div').getAttribute('id'), 'foo');
});
test('sj-if', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div id="foo" sj-if="this.foo"></div>
    <div id="bar" sj-if="this.bar"></div>
  `;
  const code = new Compiler().compile(div);
  var target = document.createElement('target');
  target.update = function () { };
  target.foo = true;
  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });
  t.ok(target.querySelector('#foo'));
  t.ok(!target.querySelector('#bar'));
});
test('sj-repeat', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="book in this.books">
      <div class="book" sj-bind="book.name"></div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.books = [{name: 'hoge'}, {name: 'fuga'}];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });


  const books = target.querySelectorAll('.book');
  t.equal(books.length, 2);
});
test('sj-repeat array kv', (t) => {
  t.plan(3);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="(i,book) in this.books">
      <div class="book"><span sj-bind="i"></span>:<span sj-bind="book.name"></span></div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.books = [{name: 'hoge'}, {name: 'fuga'}];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  const books = target.querySelectorAll('.book');
  t.equal(books.length, 2);
  t.equal(books[0].textContent, '0:hoge');
  t.equal(books[1].textContent, '1:fuga');
});
test('sj-repeat(object)', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="(x,y) in this.obj">
      <div class="item" sj-click="this.result.push(x)"><span sj-bind="x"></span>:<span sj-bind="y"></span></div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.obj = {
    a: 'b',
    c: 'd'
  };
  target.result = [];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  const items = target.querySelectorAll('.item');
  t.equal(items.length, 2);

  for (let i=0; i<items.length; i++) {
    items[i].click();
  }
  t.deepEqual(target.result, ['a', 'c']);
});
test('sj-click', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-click="this.called = true"></div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.books = [{name: 'hoge'}, {name: 'fuga'}];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  target.querySelector('div').click();

  t.ok(target.called);
});
test('sj-disabled', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div class="t" sj-disabled="true"></div>
    <div class="f" sj-disabled="false"></div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  t.equal(target.querySelector('.t').getAttribute('disabled'), 'disabled');
  t.ok(!target.querySelector('.f').getAttribute('disabled'));
});
test('sj-bind', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-bind="this.foo"></div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.foo = 'foo';

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  t.ok(target.innerHTML.match(/foo/));
});
test('nested for', (t) => {
  t.plan(2);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="blog in this.blogs">
      <div sj-repeat="entry in blog.entries">
        <div class="book"><span sj-bind="entry.title"></span>:<span sj-bind="$index"></span></div>
      </div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.blogs = [
    {entries: [
      {title:'hoge'},
      {title:'hige'}
    ]},
    {entries: [
      {title:'fuga'},
      {title:'figa'}
    ]},
  ];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  t.ok(target.innerHTML.match(/hoge/));
  t.ok(target.innerHTML.match(/fuga/));
});
test('nested for', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-repeat="blog in this.blogs">
      <div sj-repeat="entry in blog.entries">
        <div class="book" sj-click="this.result.push($index)"><span sj-bind="entry.title"></span>:<span sj-bind="$index"></span></div>
      </div>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.blogs = [
    {entries: [
      {title:'hoge'},
      {title:'hige'}
    ]},
    {entries: [
      {title:'fuga'},
      {title:'figa'}
    ]},
  ];
  target.result = [];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });
  const books = target.querySelectorAll('.book');
  for (let i=0; i<books.length; i++) {
    books[i].click();
  }
  t.deepEqual(target.result, [0,1,0,1]);
});
test('text', (t) => {
  const compiler = new Compiler();
  const s = ["\n", `"`];
  t.plan(s.length);
  for (let i=0, l=s.length; i<l; i++) {
    const m = s[i];
    t.equal(eval(compiler.text(m)), m);
  }
});
test('sj-class', (t) => {
  t.plan(1);
  var div = document.createElement('div');
  div.innerHTML = `
    <div sj-class='this.klass'>
    </div>
  `;
  const code = new Compiler().compile(div);

  var target = document.createElement('target');
  target.update = function () { };
  target.klass = ['a', 'b'];

  IncrementalDOM.patch(target, () => {
    code.apply(target, [IncrementalDOM]);
  });

  const got = target.querySelector('div');
  t.deepEqual(got.getAttribute('class'), 'a b');
});
