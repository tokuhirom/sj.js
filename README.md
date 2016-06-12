# sj.js

Tiny javascript view for custom elements based on incremental-dom.

This library supports angular1 like templating.

## SYNOPSIS

    <template id="x-foo-template">
        <div>{{this.foo}}</div>
    </template>

    <script>
        customElement.define('x-foo', sjtag({
            template: document.getElementById('x-foo-template').textContent
        }));
    </script>

    <x-foo></x-foo>

## attributes

## Supported syntax

### sj-repeat

    <select sj-repeat="x in this.ary">
        <option value="{{x.value}}" sj-model="x.label"></option>
    </select>

TODO: expression in attributes

