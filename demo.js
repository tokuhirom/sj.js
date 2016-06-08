class FooElement extends HTMLElementBase {
    constructor() {
        super();
    }

    createdCallback() {
        super.createdCallback()

        this.innerHTML = `
        <button sj-click="btnclick">yay</button>

        <hr>

        <h1>Input</h1>
        <input type="text" name="name" sj-model="name">
        Hello, <span sj-model="name"></span>

        <hr>

        <h1>Textarea</h1>
        <textarea name="hoge" sj-model="hoge"></textarea>
        Hello, <span sj-model="hoge"></span>

        <hr>

        <h1>Passed from controller</h1>
        <input type="text" name="bar" sj-model="bar">

        <hr>

        <h1>Select</h1>
        <select sj-model="sss">
            <option value="ppp">ppp</option>
            <option value="qqq">qqq</option>
        </select>
        SSS: <span sj-model="sss"></span>
        `;

        this.scope.bar = "aaa";
    }

    btnclick(e) {
        alert("Clicked");
    }

    set name(v) {
        console.log(v);
    }
}
customElements.define('x-foo', FooElement);

