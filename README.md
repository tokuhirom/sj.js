# sj.js

Tiny 2way data binding library for custom elements.

This library is based on incremental-dom.

## Supported syntax

### sj-for

    <select sj-for="x in ary">
        <option value="{{x.value}}" sj-model="x.label"></option>
    </select>

TODO: expression in attributes

## sj-expression

sj supports sj-expression.

    x : get `scope['x']`
    x.0 : get `scope['x'][0]`
    x.foo() : call `scope['x']['foo']()`

