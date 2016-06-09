# sj.js

Tiny javascript view for custom elements based on incremental-dom.

This library supports angular1 like templating.

## SYNOPSIS

    <template id="x-foo-template">
        <div>{{foo}}</div>
    </template>

    <script>
        customElement.define('x-foo', sjtag({
            template: document.getElementById('x-foo-template').textContent,
            accessors: {
                foo: {
                    set: function (v) {
                        this.scope.foo = v;
                    }
                }
            }
        }));
    </script>

    <x-foo></x-foo>

If you don't need to support legacy browsers, you can write a code like this:

    customElement.define('x-foo', class extends SJElement {
        template() {
            `<div>{{foo}}</div>`
        }

        set foo(v) {
            this.scope.foo = v;
        }
    });

## attributes

## Supported syntax

### sj-repeat

    <select sj-repeat="x in ary">
        <option value="{{x.value}}" sj-model="x.label"></option>
    </select>

TODO: expression in attributes

## sj-expression

sj supports sj-expression.

    x : get `scope['x']`
    x.0 : get `scope['x'][0]`
    x.foo() : call `scope['x']['foo']()`

