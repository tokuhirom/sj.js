# sj.js

Tiny javascript view for custom elements based on incremental-dom.

This library supports angular1 like templating.

## SYNOPSIS

    <!doctype html>
    <html>
    <head>
        <script type="text/javascript" src="dist/sj.bundle.js"></script>
    </head>
    <body>
        <template id="x-foo-template">
            <div>{{this.foo}}</div>
        </template>

        <script>
            sj.tag('x-foo', {
                template: document.getElementById('x-foo-template').textContent
            }));
        </script>

        <x-foo></x-foo>
    </dody>
    </html>

## sj.tag

`sj.tag(TAGNAME, OPTIONS)` is an entry point to create custom element.
_TAGNAME_ is a name of your custom element.
_OPTIONS_ is a hash contains options described below.

### template

TBD

### accessors

TBD

### methods

TBD

## sj-repeat

You can iterate over array via sj-repeat.

    <select sj-repeat="x in this.ary">
        <option value="{{x.value}}" sj-model="x.label"></option>
    </select>

_this_ indicates custom element.

You can repeat over the object.

    <select sj-repeat="(key, value) in this.obj">
        {{key}}:{{value}}
    </select>

## sj-if

    <div sj-if="<<EXPRESSION>>"></div>

Hide element if evaluated value is falsy. You can write any ecmascript expression in there.
In expression, _this_ indicates your custom element.

## sj-class

    <div sj-class="<<EXPRESSION>>"></div>

Specify the element's class by sj.
In expression, _this_ indicates your custom element.

sample:

    <div sj-class="this.foo"></div>

## sj-style

    <div sj-style="<<EXPRESSION>>"></div>

You can specify the styles for element via `sj-style` attribute.
In expression, _this_ indicates your custom element.

sample:

    <div sj-style="{color: 'red'}"></div>

## Text replacement

    <div>Hello, {{this.name}}</div>

sj replaces `{{EXPR}}` in text node. In expression, _this_ indicates your custom element.

## Event Handler

    <button sj-click="this.click($event)"></button>

You can set event handler via sj.
_this_ indicates your custom element. _$event_ is the event object that caught.

Following event handlers are supported now.

  'sj-click': 'onclick',
  'sj-blur': 'onblur',
  'sj-checked': 'onchecked',
  'sj-dblclick': 'ondblclick',
  'sj-focus': 'onfocus',
  'sj-keydown': 'onkeydown',
  'sj-keypress': 'onkeypress',
  'sj-keyup': 'onkeyup',
  'sj-mousedown': 'onmousedown',
  'sj-mouseenter': 'onmouseenter',
  'sj-mouseleave': 'onmouseleave',
  'sj-mousemove': 'onmousemove',
  'sj-mouseover': 'onmouseover',
  'sj-mouseup': 'onmouseup',
  'sj-paste': 'onpaste',
  'sj-selected': 'onselected',
  'sj-submit': 'onsubmit'

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

## AUTHORS

 * Tokuhiro Matsuno
 * Yasuhiro MATSUMOTO

## development

    npm install -g uglify testling babelify browserify
    make
    make test

## FAQ

### Can't use `style="color: {{color}}"` in Internet Explorer

IE returns DOM attributes from parsed DOM data.
IE removes invalid stylesheet element like `color: {{color}}`.

You should use `sj-style` instead.

## LICENSE

    The MIT License (MIT)
    Copyright © 2016 Tokuhiro Matsuno, http://64p.org/ <tokuhirom@gmail.com>

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the “Software”), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
