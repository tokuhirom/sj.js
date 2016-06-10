/**
 *
 * You shouldn't use following syntax in this script:
 *
 * - Safari doesn't support `let` and `const` yet@20160609.
 *   - https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Statements/let
 * - Safari doesn't support Arrow expression like `e => { }` yet @20160609
 *   - https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions
 *
 */
window.addEventListener("load", function () {
  class Assertion {
    constructor(logElement) {
      this.successCount = 0;
      this.failCount = 0;
      this.logElement = logElement;
    }

    ok(v, msg) {
      var status = v? 'ok' : 'not ok';
      var result = `${status} - ${msg}`;
      this.log(result);
      if (v) {
        this.successCount++;
      } else {
        this.failCount++;
      }
    }

    fail(msg) {
      this.ok(false, msg);
    }

    skip(msg) {
      this.log(`skip - ${msg}`);
    }

    log(msg) {
      this.logElement.textContent += `${msg}\n`;
      console.log(msg);
    }
  }
  var t = new Assertion(document.getElementById('logs'));

  function runTest(tagName, elementClass, code) {
    try {
      if (location.hash && tagName !== location.hash.substr(1)) {
        t.skip(tagName);
        return;
      }

      var elem = document.createElement(tagName);
      code.apply(elem, [t, tagName]);
      console.log(elem.innerHTML);
    } catch (e) {
      console.log(e);
      t.fail(`${tagName} - ${e}`);
    }
  }

  runTest('test-input-value', sj.tag('test-input-value', {
    template: function() {/*
                             <input type="text" sj-model="bar">
    */},
    initialize: function() {
      this.scope.bar = 'hoge';
    }
  }), function (t, tagName) {
    var input = this.querySelector('input');
    t.ok(input.value === 'hoge', tagName);
  });

  runTest('test-disabled', sj.tag('test-disabled', {
    template: function() {/*
        <div sj-disabled="f">f</div>
        <div sj-disabled="t">t</div>
    */},
    initialize: function() {
      this.scope.t = true;
      this.scope.f = false;
    }
  }), function (t, tagName) {
    var divs = this.querySelectorAll('div');
    t.ok(divs.length == 2, tagName);
    t.ok(!divs[0].getAttribute('disabled'), tagName);
    t.ok(divs[1].getAttribute('disabled')==='disabled', tagName);
  });

  // regression test
  runTest('test-multi-attributes', sj.tag('test-multi-attributes', {
    template: function() {/*
        <div class="b" sj-repeat="x in books">
            <div class='book'>{{x.name}}</div>
        </div>
    */},
    initialize: function() {
      this.scope.books = [{"name":"foo"}, {"name":"bar"}];
    }
  }), function (t, tagName) {
    t.ok(this.querySelectorAll('div.book').length === 2, tagName);
  });

  runTest('test-events', sj.tag('test-events', {
    template: function() {/*
                             <button id="clickTest" sj-click="btnclick($event)">yay</button>
                             */},
    initialize: function() {
      this.scope.btnclick = function (e) {
        this.scope.clicked = true;
      };
    }
  }), function (t) {
    var elem = this.querySelector("#clickTest");
    elem.click();

    t.ok(!!this.scope.clicked, 'test-events');
  });

  runTest('test-set-attrs', sj.tag('test-set-attrs', {
    template: '<div>{{foo}}</div>',
    accessors: {
      foo: {
        get: function () {
          return this.scope.foo;
        },
        set: function (v) {
          this.scope.foo = v;
        }
      }
    }
  }), function (t, tagName) {
    this.setAttribute('foo', 'bar');
    t.ok(this.querySelector('div').textContent, 'bar');
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

    t.ok(this.querySelector('span').textContent === "foo", tagName);
  });

  runTest('test-input-nested', sj.tag('test-input-nested', {
    template: function () {/*
      <h1>Input</h1>
      <input type="text" name="name" sj-model="x.y" id="myInput">
      Hello, <span sj-model="name"></span>
    */},
    initialize: function() {
      this.scope.x = {
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

    t.ok(this.scope.x.y === 'foo', tagName);
  });

  runTest('test-textarea', sj.tag('test-textarea', {
    template: function () {/*
      <h1>Textarea</h1>
      <textarea name="hoge" sj-model="hoge"></textarea>
      Hello, <span sj-model="hoge"></span>
    */}
  }), function (t, tagName) {
    var input = this.querySelector('textarea');
    input.value = "foo";
    input.dispatchEvent(new Event("change"));

    t.ok(this.querySelector('span').textContent === "foo", tagName);
  });

  runTest('test-from-controller', sj.tag('test-from-controller', {
    initialize: function() {
      this.scope.hogehoge = "foo";
    },
    template: function() {/*
      <h1>Passed from controller</h1>
      <input type="text" name="bar" sj-model="hogehoge">
    */}
  }), function (t, tagName) {
    t.ok(this.querySelector('input').value === "foo", tagName);
  });

  runTest('test-select', sj.tag('test-select', {
    template: function () {/*
      <h1>Select</h1>
      <select sj-model="sss">
      <option value="ppp">ppp</option>
      <option value="qqq">qqq</option>
      </select>
      SSS: <span sj-model="sss"></span>
    */}
  }), function (t, tagName) {
    return this.querySelector('span').textContent === "ppp";
  });

  runTest('test-for', sj.tag('test-for', {
    template: function() {/*
      <h1>bar</h1>
      <div sj-repeat="x in bar">
      <div class="item" sj-model="x.boo">replace here</div>
      </div>
    */},
    initialize: function () {
      this.scope.bar = [
        {boo: 4649},
        {boo: 1},
        {boo: 2},
        {boo: 3}
      ];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.ok(elems.length == 4 && elems[0].textContent == "4649" && elems[1].textContent === '1' &&
         elems[2].textContent === '2' && elems[3].textContent === '3', tagName);
  });

  runTest('test-for-index', sj.tag('test-for-index', {
    template: function () {/*
      <h1>For index</h1>
      <div sj-repeat="x in bar">
      <div class="item">{{x.boo}}:{{$index}}</div>
      </div>
    */},
    initialize: function () {
      this.scope.bar = [
        {boo: 4649},
        {boo: 1},
        {boo: 2},
        {boo: 3}
      ];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.ok(elems.length == 4 && elems[0].textContent == "4649:0" && elems[1].textContent === '1:1' &&
         elems[2].textContent === '2:2' && elems[3].textContent === '3:3', tagName);
  });

  runTest('test-for-empty', sj.tag('test-for-empty', {
    template: function () {/*
      <h1>sj-repeat with empty value</h1>
      <div sj-repeat="x in bar">
      <div class="item" sj-model="x.boo">replace here</div>
      </div>
    */},
    initialize: function() {
      this.scope.bar = [];
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.item');
    t.ok(elems.length == 0, tagName);
  });

  runTest('test-attr-var', sj.tag('test-attr-var', {
    template: function () {/*
      <h1>Attr variable</h1>
      <div style="color: {{ccc}}">CONTENT</div>`;
    */},
    initialize: function () {
      this.scope.ccc = "green";
    }
  }), function (t, tagName) {
    var elems = this.querySelector('div');
    t.ok(elems.style.color === 'green', tagName);
  });

  runTest('test-if', sj.tag('test-if', {
    template: function () {/*
      <h1>Test if</h1>
      <div sj-if="getFalse()">FALSE</div>
      <div sj-if="getTrue()">TRUE</div>
    */},
    initialize: function () {
      this.scope.getTrue = function (e) {
        return true
      };
      this.scope.getFalse = function (e) {
        return false
      };
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div');
    t.ok(elems.length == 1 && elems[0].textContent === 'TRUE', tagName);
  });

  runTest('test-if-array', sj.tag('test-if-array', {
    template: function() {/*
      return `
      <h1>Test if</h1>
      <div sj-repeat="x in bar">
      <div sj-if="matched(x)" sj-model="x.foo" class="target"></div>
      </div>
    */},
    initialize: function () {
      this.scope.bar = [{"foo":1}]
      this.scope.matched = function(x) {
        return x.foo == 1;
      };
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div.target');
    t.ok(elems.length === 1 && elems[0].textContent === '1', tagName);
  });

  runTest('test-text-var', sj.tag('test-text-var', {
    template: function() {/*
      <h1>Test text var</h1>
      <div>Hello, {{name}}</div>
    */},
    initialize: function () {
      this.scope.name = 'John';
    }
  }), function (t, tagName) {
    var elem = this.querySelector('div');
    t.ok(elem.textContent === 'Hello, John', tagName);
  });

  runTest('test-filter', sj.tag('test-filter', {
    template: function() {/*
      <h1>Test filter</h1>
      <div sj-if="filter(x.y)">Hello</div>
      <div sj-if="filter(x.z)">Hi</div>
    */},
    initialize: function () {
      this.scope.x = {
        y: true,
        z: false
      };
      this.scope.filter = function (e) {
        return e;
      };
    }
  }), function (t, tagName) {
    var elems = this.querySelectorAll('div');
    t.ok(elems.length === 1 && elems[0].textContent === 'Hello', tagName);
  });

  runTest('test-comment', sj.tag('test-comment', {
    template: function () {/*
      <h1>Test comment</h1>
      <!-- foo -->
    */}
  }), function (t, tagName) {
    t.ok(this.querySelector('h1'), tagName);
  });

  var resultElem = document.getElementById("testResult");
  resultElem.textContent = `Success: ${t.successCount} Fail: ${t.failCount}`;
  if (!t.failCount && location.hash) {
    resultElem.style.color = "yellow";
  } else if (t.failCount > 0) {
    resultElem.style.color = "red";
  } else {
    resultElem.style.color = 'green';
  }
});
