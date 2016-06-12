var test = require('tape');
var sj = require('../src/main.js');
(function () {
  "use strict";

  function runTest(tagName, elementClass, code) {
    test(tagName, function (t) {
      var elem = document.createElement(tagName);
      code.apply(elem, [t, tagName]);
    });
  }

  test('export', function (t) {
    t.plan(2);
    t.ok(sj.tag, 'sj.tag');
    t.ok(sj.Element, 'sj.Element');
  });

  runTest('test-input-value', sj.tag('test-input-value', {
    template: function() {/*
                             <input type="text" sj-model="this.filter" value="hoge">
    */}
  }), function (t, tagName) {
    t.plan(2);
    var input = this.querySelector('input');

    t.equal(input.value, 'hoge', 'input.value');
    t.equal(this.filter, 'hoge', tagName);
  });

  runTest('test-disabled', sj.tag('test-disabled', {
    template: function() {/*
        <div sj-disabled="this.f">f</div>
        <div sj-disabled="this.t">t</div>
    */},
    initialize: function() {
      this.t = true;
      this.f = false;
    }
  }), function (t, tagName) {
    t.plan(3);
    var divs = this.querySelectorAll('div');
    t.ok(divs.length == 2, tagName);
    t.ok(!divs[0].getAttribute('disabled'), tagName);
    t.ok(divs[1].getAttribute('disabled')==='disabled', tagName);
  });

  // regression test
  runTest('test-multi-attributes', sj.tag('test-multi-attributes', {
    template: function() {/*
        <div class="b" sj-repeat="x in this.books">
            <div class='book'>{{x.name}}</div>
        </div>
    */},
    initialize: function() {
      this.books = [{"name":"foo"}, {"name":"bar"}];
    }
  }), function (t, tagName) {
    t.plan(1);
    t.equal(this.querySelectorAll('div.book').length, 2, tagName);
  });

  runTest('test-events', sj.tag('test-events', {
    template: function() {/*
                             <button id="clickTest" sj-click="this.btnclick($event)">yay</button>
                             */},
    methods: {
      btnclick: function() {
        this.clicked = true;
      }
    }
  }), function (t) {
    var elem = this.querySelector("#clickTest");
    elem.click();

    t.plan(1);
    t.ok(!!this.clicked, 'test-events');
  });

  runTest('test-set-attrs', sj.tag('test-set-attrs', {
    template: '<div>{{this.foo}}</div>'
  }), function (t, tagName) {
    this.setAttribute('foo', 'bar');
    t.plan(1);
    t.equal(this.querySelector('div').textContent, 'bar');
  });

  runTest('test-input', sj.tag('test-input', {
    template: function () {/*
                              <h1>Input</h1>
                              <input type="text" name="name" sj-model="name" id="myInput">
                              Hello, <span sj-model="name"></span>
                              */}
  }), function (t, tagName) {
    var input = this.querySelector('input');
    input.value = 'foo';

    // simulate onchange event
    // http://stackoverflow.com/questions/2856513/how-can-i-trigger-an-onchange-event-manually
    if ("createEvent" in document) {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", false, true);
      input.dispatchEvent(evt);
    } else {
      input.fireEvent("onchange");
    }

    t.plan(1);
    t.ok(this.querySelector('span').textContent === "foo", tagName);
  });

  runTest('test-input-nested', sj.tag('test-input-nested', {
    template: function () {/*
      <h1>Input</h1>
      <input type="text" name="name" sj-model="this.x.y" id="myInput">
      Hello, <span sj-model="this.name"></span>
    */},
    initialize: function() {
      this.x = {
        y: 3
      };
    }
  }), function (t, tagName) {
    var input = this.querySelector('input');
    input.value = 'foo';

    // simulate onchange event
    // http://stackoverflow.com/questions/2856513/how-can-i-trigger-an-onchange-event-manually
    if ("createEvent" in document) {
      var evt = document.createEvent("HTMLEvents");
      evt.initEvent("change", false, true);
      input.dispatchEvent(evt);
    } else {
      input.fireEvent("onchange");
    }

    t.plan(1);
    t.ok(this.x.y === 'foo', tagName);
  });

  runTest('test-textarea', sj.tag('test-textarea', {
    template: function () {/*
      <h1>Textarea</h1>
      <textarea name="hoge" sj-model="this.hoge"></textarea>
      Hello, <span sj-model="this.hoge"></span>
    */}
  }), function (t, tagName) {
    var input = this.querySelector('textarea');
    input.value = "foo";
    input.dispatchEvent(new Event("change"));

    t.plan(1);
    t.ok(this.querySelector('span').textContent === "foo", tagName);
  });

  runTest('test-from-controller', sj.tag('test-from-controller', {
    initialize: function() {
      this.hogehoge = "foo";
    },
    template: function() {/*
      <h1>Passed from controller</h1>
      <input type="text" name="bar" sj-model="this.hogehoge">
    */}
  }), function (t, tagName) {
    t.plan(1);
    t.ok(this.querySelector('input').value === "foo", tagName);
  });

  runTest('test-select', sj.tag('test-select', {
    template: function () {/*
      <h1>Select</h1>
      <select sj-model="this.sss">
      <option value="ppp">ppp</option>
      <option value="qqq">qqq</option>
      </select>
      SSS: <span sj-model="this.sss"></span>
    */}
  }), function (t, tagName) {
    t.plan(1);
    t.equal(this.querySelector('span').textContent, "ppp");
  });

  runTest('test-for', sj.tag('test-for', {
    template: function() {/*
      <h1>bar</h1>
      <div sj-repeat="x in this.bar">
      <div class="item" sj-model="x.boo">replace here</div>
      </div>
    */},
    initialize: function () {
      this.bar = [
        {boo: 4649},
        {boo: 1},
        {boo: 2},
        {boo: 3}
      ];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.plan(1);
    t.ok(elems.length == 4 && elems[0].textContent == "4649" && elems[1].textContent === '1' &&
         elems[2].textContent === '2' && elems[3].textContent === '3', tagName);
  });

  runTest('test-for-index', sj.tag('test-for-index', {
    template: function () {/*
      <h1>For index</h1>
      <div sj-repeat="x in this.bar">
      <div class="item">{{x.boo}}:{{$index}}</div>
      </div>
    */},
    initialize: function () {
      this.bar = [
        {boo: 4649},
        {boo: 1},
        {boo: 2},
        {boo: 3}
      ];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.plan(1);
    t.ok(elems.length == 4 && elems[0].textContent == "4649:0" && elems[1].textContent === '1:1' &&
         elems[2].textContent === '2:2' && elems[3].textContent === '3:3', tagName);
  });

  runTest('test-for-empty', sj.tag('test-for-empty', {
    template: function () {/*
      <h1>sj-repeat with empty value</h1>
      <div sj-repeat="x in this.bar">
      <div class="item" sj-model="x.boo">replace here</div>
      </div>
    */},
    initialize: function() {
      this.bar = [];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.plan(1);
    t.ok(elems.length == 0, tagName);
  });

  runTest('test-attr-var', sj.tag('test-attr-var', {
    template: function () {/*
      <h1>Attr variable</h1>
      <div style="color: {{this.ccc}}">CONTENT</div>`;
    */},
    initialize: function () {
      this.ccc = "green";
    }
  }), function (t, tagName) {
    var elems = this.querySelector('div');
    t.plan(1);
    t.ok(elems.style.color === 'green', tagName);
  });

  runTest('test-if', sj.tag('test-if', {
    template: function () {/*
      <h1>Test if</h1>
      <div sj-if="this.getFalse()">FALSE</div>
      <div sj-if="this.getTrue()">TRUE</div>
    */},
    methods: {
      getTrue: function () {
        return true
      },
      getFalse: function() {
        return false
      }
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div');
    t.plan(1);
    t.ok(elems.length == 1 && elems[0].textContent === 'TRUE', tagName);
  });

  runTest('test-if-array', sj.tag('test-if-array', {
    template: function() {/*
      return `
      <h1>Test if</h1>
      <div sj-repeat="x in this.bar">
        <div sj-if="this.matched(x)" sj-model="x.foo" class="target"></div>
      </div>
    */},
    initialize: function () {
      this.bar = [{"foo":1}];
    },
    methods: {
      matched: function (x) {
        return x.foo == 1;
      }
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.target');
    t.plan(1);
    t.ok(elems.length === 1 && elems[0].textContent === '1', tagName);
  });

  runTest('test-text-var', sj.tag('test-text-var', {
    template: function() {/*
      <h1>Test text var</h1>
      <div>Hello, {{this.name}}</div>
    */},
    initialize: function () {
      this.name = 'John';
    }
  }), function (t, tagName) {
    var elem = this.querySelector('div');
    t.plan(1);
    t.ok(elem.textContent === 'Hello, John', tagName);
  });

  runTest('test-filter', sj.tag('test-filter', {
    template: function() {/*
      <h1>Test filter</h1>
      <div sj-if="this.filter(this.x.y)">Hello</div>
      <div sj-if="this.filter(this.x.z)">Hi</div>
    */},
    initialize: function () {
      this.x = {
        y: true,
        z: false
      };
      this.filter = function (e) {
        return e;
      };
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div');
    t.plan(1);
    t.ok(elems.length === 1 && elems[0].textContent === 'Hello', tagName);
  });

  runTest('test-comment', sj.tag('test-comment', {
    template: function () {/*
      <h1>Test comment</h1>
      <!-- foo -->
    */}
  }), function (t, tagName) {
    t.plan(1);
    t.ok(this.querySelector('h1'), tagName);
  });
})();
