customElements.define('test-events', class extends HTMLElementBase {
  initialize() {
    this.innerHTML = `
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

  done_testing() {
    return !!this.clicked;
  }
});

customElements.define('test-input', class extends HTMLElementBase {
  initialize() {
    this.innerHTML = `
        <h1>Input</h1>
        <input type="text" name="name" sj-model="name" id="myInput">
        Hello, <span sj-model="name"></span>
        `;
  }

  attachedCallback() {
    this.querySelector('input').value = 'foo';
    const input = this.querySelector('input');
    input.dispatchEvent(new Event("change"));
  }

  done_testing() {
    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-textarea', class extends HTMLElementBase {
  initialize() {
    this.innerHTML = `
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

  done_testing() {
    return this.querySelector('span').textContent === "foo";
  }
});

customElements.define('test-from-controller', class extends HTMLElementBase {
  initialize() {
    this.innerHTML = `
        <h1>Passed from controller</h1>
        <input type="text" name="bar" sj-model="bar">
    `;
    this.scope.bar = "foo";
  }

  attachedCallback() {
  }

  done_testing() {
    return this.querySelector('input').value === "foo";
  }
});

customElements.define('test-select', class extends HTMLElementBase {
  initialize() {
    this.innerHTML = `
        <h1>Select</h1>
        <select sj-model="sss">
            <option value="ppp">ppp</option>
            <option value="qqq">qqq</option>
        </select>
        SSS: <span sj-model="sss"></span>
    `;
  }

  done_testing() {
    return this.querySelector('span').textContent === "ppp";
  }
});

// test case runner
window.addEventListener("load", function () {
  let tests = document.getElementsByClassName("test");
  let successCount = 0;
  let failCount = 0;
  for (let i = 0, l = tests.length; i < l; i++) {
    const success = tests[i].done_testing();
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
