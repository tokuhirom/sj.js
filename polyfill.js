// polyfill
if (!window.customElements) {
    window.customElements = {
        define: function (name, elem) {
            document.registerElement(name, elem);
        }
    };
}

