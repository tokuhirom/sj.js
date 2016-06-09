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

customElements.define('test-events', class extends SJElement {
  template() {
    return `
    <button id="clickTest" sj-click="btnclick">yay</button>
    `;
  }

  btnclick() {
    this.scope.clicked = true;
  }

  runTest() {
    var elem = this.querySelector("#clickTest");
    elem.click();

    return !!this.scope.clicked;
  }
});

customElements.define('test-input', class extends SJElement {
  template() {
    return `
    <h1>Input</h1>
    <input type="text" name="name" sj-model="name" id="myInput">
    Hello, <span sj-model="name"></span>
    `;
  }

  runTest() {
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

    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-textarea', class extends SJElement {
  template() {
    return `
    <h1>Textarea</h1>
    <textarea name="hoge" sj-model="hoge"></textarea>
    Hello, <span sj-model="hoge"></span>
    `;
  }

  runTest() {
    var input = this.querySelector('textarea');
    input.value = "foo";
    input.dispatchEvent(new Event("change"));

    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-from-controller', class extends SJElement {
  initialize() {
    this.scope.hogehoge = "foo";
  }

  template() {
    return `
    <h1>Passed from controller</h1>
    <input type="text" name="bar" sj-model="hogehoge">
    `;
  }

  runTest() {
    return this.querySelector('input').value === "foo";
  }
});

customElements.define('test-select', class extends SJElement {
  template() {
    return `
    <h1>Select</h1>
    <select sj-model="sss">
    <option value="ppp">ppp</option>
    <option value="qqq">qqq</option>
    </select>
    SSS: <span sj-model="sss"></span>
    `;
  }

  runTest() {
    return this.querySelector('span').textContent === "ppp";
  }
});

customElements.define('test-for', class extends SJElement {
  template() {
    return `
    <h1>bar</h1>
    <div sj-repeat="x in bar">
    <div class="item" sj-model="x.boo">replace here</div>
    </div>
    `;
  }

  initialize() {
    this.scope.bar = [
      {boo: 4649},
      {boo: 1},
      {boo: 2},
      {boo: 3}
    ];
  }

  runTest() {
    var elems = this.querySelectorAll('div.item');
    return elems.length == 4 && elems[0].textContent == "4649" && elems[1].textContent === '1' &&
           elems[2].textContent === '2' && elems[3].textContent === '3';
  }
});

customElements.define('test-for-index', class extends SJElement {
  template() {
    return `
    <h1>For index</h1>
    <div sj-repeat="x in bar">
    <div class="item">{{x.boo}}:{{$index}}</div>
    </div>
    `;
  }

  initialize() {
    this.scope.bar = [
      {boo: 4649},
      {boo: 1},
      {boo: 2},
      {boo: 3}
    ];
  }

  runTest() {
    var elems = this.querySelectorAll('div.item');
    return elems.length == 4 && elems[0].textContent == "4649:0" && elems[1].textContent === '1:1' &&
           elems[2].textContent === '2:2' && elems[3].textContent === '3:3';
  }
});

customElements.define('test-for-empty', class extends SJElement {
  template() {
    return `
    <h1>sj-repeat with empty value</h1>
    <div sj-repeat="x in bar">
    <div class="item" sj-model="x.boo">replace here</div>
    </div>
    `;
  }

  initialize() {
    this.scope.bar = [];
  }

  runTest() {
    var elems = this.querySelectorAll('div.item');
    return elems.length == 0;
  }
});

customElements.define('test-attr-var', class extends SJElement {
  template() {
    return `
    <h1>Attr variable</h1>
    <div style="color: {{ccc}}">CONTENT</div>`;
  }

  initialize() {
    this.scope.ccc = "green";
  }

  runTest() {
    var elems = this.querySelector('div');
    return elems.style.color === 'green';
  }
});

customElements.define('test-if', class extends SJElement {
  template() {
    return `
    <h1>Test if</h1>
    <div sj-if="getFalse()">FALSE</div>
    <div sj-if="getTrue()">TRUE</div>`;
  }

  initialize() {
    this.scope.getTrue = function (e) {
      return true
    };
    this.scope.getFalse = function (e) {
      return false
    };
  }

  runTest() {
    var elems = this.querySelectorAll('div');
    return elems.length == 1 && elems[0].textContent === 'TRUE';
  }
});

customElements.define('test-if-array', class extends SJElement {
  template() {
    return `
    <h1>Test if</h1>
    <div sj-repeat="x in bar">
    <div sj-if="matched(x)" sj-model="x.foo"></div>
    </div>`
  }

  initialize() {
    this.scope.bar = [{"foo":1}]
    this.scope.matched = function (e) {
      return x.foo == 1;
    };
  }

  runTest() {
    var elems = this.querySelectorAll('div');
    return elems.length == 1 && elems[0].textContent === '1';
  }
});

customElements.define('test-text-var', class extends SJElement {
  template() {
    return `
    <h1>Test text var</h1>
    <div>Hello, {{name}}</div>
    `;
  }

  initialize() {
    this.scope.name = 'John';
  }

  runTest() {
    var elem = this.querySelector('div');
    return elem.textContent === 'Hello, John';
  }
});

customElements.define('test-2way', class extends SJElement {
  template() {
    return `
    <h1>Test 2way binding</h1>
    <div>Hello, {{name}}</div>
    `;
  }

  initialize() {
    this.scope.name = 'John';
  }

  runTest() {
    var elem = this.querySelector('div');
    this.scope.name = 'Nick';
    return elem.textContent === 'Hello, Nick';
  }
});

customElements.define('test-filter', class extends SJElement {
  template() {
    return `
    <h1>Test filter</h1>
    <div sj-if="filter(x.y)">Hello</div>
    <div sj-if="filter(x.z)">Hi</div>
    `;
  }

  initialize() {
    this.scope.x = {
      y: true,
      z: false
    };
    this.scope.filter = function (e) {
      return e;
    };
  }

  runTest() {
    var elems = this.querySelectorAll('div');
    return elems.length === 1 && elems[0].textContent === 'Hello';
  }
});

customElements.define('test-comment', class extends SJElement {
  template() {
    return `
    <h1>Test comment</h1>
    <!-- foo -->
    `;
  }

  runTest() {
    return this.querySelector('h1');
  }
});

// test case runner
window.addEventListener("load", function () {
  var tags = [
    "test-events",
    "test-input",
    "test-textarea",
    "test-from-controller",
    "test-select",
    "test-for",
    "test-for-index",
    "test-for-empty",
    "test-attr-var",
    "test-if",
    "test-if-array",
    "test-text-var",
//    "test-2way", //     Proxy doesn't work on safari.
    "test-filter",
    "test-comment"
  ];
  var logs = document.getElementById("logs");
  var successCount = 0;
  var failCount = 0;
  window.exceptions = [];

  class Assertion {
    ok(v, msg) {
      var status = v? 'ok' : 'not ok';
      var result = `${status} - ${msg}`;
      logs.textContent += `${result}\n`;
      console.log(result);
      if (v) {
        successCount++;
      } else {
        failCount++;
      }
    }

    fail(msg) {
      this.ok(false, msg);
    }
  }
  var t = new Assertion();

  for (var tag of tags) {
    if (location.hash && tag !== location.hash.substr(1)) {
      logs.textContent += `skip ${tag}\n`;
      continue;
    }
    try {
      var elem = document.createElement(tag);
      t.ok(elem.runTest(), tag);
    } catch (e) {
      window.exceptions.push(e);
      console.log(e);
      t.fail(`${tag} - ${e}`);
    }
  }

  var resultElem = document.getElementById("testResult");
  resultElem.textContent = `Success: ${successCount} Fail: ${failCount} Total: ${tags.length}`;
  if (location.hash) {
    resultElem.style.color = "yellow";
  } else if (successCount === tags.length) {
    resultElem.style.color = "green";
  } else {
    resultElem.style.color = "red";
  }
});
