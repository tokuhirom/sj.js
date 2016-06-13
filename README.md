# sj.js

Tiny javascript view for custom elements based on incremental-dom.

This library supports angular1 like templating.

## Browser support

(Same as jQuery 3.0)

Desktop

    Chrome: (Current - 1) and Current
    Edge: (Current - 1) and Current
    Firefox: (Current - 1) and Current
    Internet Explorer: 9+
    Safari: (Current - 1) and Current
    Opera: Current

Mobile

    Android: 4.0+
    iOS: 7+

## SYNOPSIS

    <!doctype html>
    <html>
    <head>
        <script type="text/javascript"></script>
    </head>
    <body>
        <template id="x-foo-template">
            <div>{{this.foo}}</div>
        </template>

        <script>
            customElement.define('x-foo', sjtag({
                template: document.getElementById('x-foo-template').textContent
            }));
        </script>

        <x-foo></x-foo>
    </dody>
    </html>

## attributes

## Supported syntax

### sj-repeat

    <select sj-repeat="x in this.ary">
        <option value="{{x.value}}" sj-model="x.label"></option>
    </select>

TODO: expression in attributes

