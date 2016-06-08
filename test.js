customElements.define('test-events', class extends HTMLElementBase {
  template() {
    return `
        <button id="clickTest" sj-click="btnclick">yay</button>
    `;
  }

  attachedCallback() {
    console.log("GO");
    let elem = document.getElementById("clickTest");
    elem.click();
  }

  btnclick() {
    this.clicked = true;
  }

  doneTesting() {
    return !!this.clicked;
  }
});

customElements.define('test-input', class extends HTMLElementBase {
  template() {
    return `
        <h1>Input</h1>
        <input type="text" name="name" sj-model="name" id="myInput">
        Hello, <span sj-model="name"></span>
    `;
  }

  attachedCallback() {
    const input = this.querySelector('input');
    input.value = 'foo';
    input.dispatchEvent(new Event("change"));
  }

  doneTesting() {
    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-textarea', class extends HTMLElementBase {
  template() {
    return `
        <h1>Textarea</h1>
        <textarea name="hoge" sj-model="hoge"></textarea>
        Hello, <span sj-model="hoge"></span>
    `;
  }

  attachedCallback() {
    const input = this.querySelector('textarea');
    input.value = "foo";
    input.dispatchEvent(new Event("change"));
  }

  doneTesting() {
    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-from-controller', class extends HTMLElementBase {
  initialize() {
    this.scope.hogehoge = "foo";
  }

  template() {
    return `
        <h1>Passed from controller</h1>
        <input type="text" name="bar" sj-model="hogehoge">
    `;
  }

  doneTesting() {
    return this.querySelector('input').value === "foo";
  }
});

customElements.define('test-select', class extends HTMLElementBase {
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

  doneTesting() {
    return this.querySelector('span').textContent === "ppp";
  }
});

customElements.define('test-for', class extends HTMLElementBase {
  template() {
    return `
        <h1>bar</h1>
        <div sj-for="x in bar">
          <div class="item" sj-model="x.boo">replace here</div>
        </div>
    `;
  }

  initialize() {
    this.scope.bar = [
      {boo: 4649},
      {boo: 4649},
      {boo: 4649},
      {boo: 4649}
    ];
  }

  attachedCallback() {
  }

  doneTesting() {
    const elems = this.querySelectorAll('div');
    return elems.length == 4 && elems[0].textContent == "4649";
  }
});

customElements.define('test-attr-var', class extends HTMLElementBase {
  template() {
    return `
    <h1>Attr variable</h1>
    <div style="color: {{ccc}}">CONTENT</div>`;
  }

  initialize() {
    this.scope.ccc = "green";
  }

  attachedCallback() {
  }

  doneTesting() {
    const elems = this.querySelector('div');
    return elems.style.color === 'green';
  }
});

// test case runner
window.addEventListener("load", function () {
  const tests = document.getElementsByClassName("test");
  let successCount = 0;
  let failCount = 0;
  for (let i = 0, l = tests.length; i < l; i++) {
    const success = tests[i].doneTesting();
    if (success) {
      successCount++;

      tests[i].style.backgroundColor = "green";
    } else {
      failCount++;

      tests[i].style.backgroundColor = "red";
    }
  }

  const resultElem = document.getElementById("testResult");
  resultElem.textContent = `Success: ${successCount} Fail: ${failCount} Total: ${tests.length}`;
  if (successCount === tests.length) {
    resultElem.style.color = "green";
  } else {
    resultElem.style.color = "red";
  }
});
