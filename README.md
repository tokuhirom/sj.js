# sj.js

Tiny javascript view for custom elements based on incremental-dom.

This library supports angular1 like templating.

## SYNOPSIS

    customElement.define('x-foo', sjtag({
        template: '<div>{{foo}}</div>',
        accessors: {
            foo: {
                set: function (v) {
                    this.scope.foo = v;
                }
            }
        }
    }));

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

