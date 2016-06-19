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
            <div sj-bind="this.foo"></div>
        </template>

        <script>
            sj.tag('x-foo', {
                template: document.getElementById('x-foo-template').textContent
            }));
        </script>

        <x-foo></x-foo>
    </body>
    </html>

## `sj.fireEvent(element, eventName, options)`

You can send a custom event to the _element_ by this method.

_element_ is a target element to send event.

_eventName_ is an event name.

_options_ is argument for custom events. That can contain following parameters:


    * detail: message object
    * bubbles: True if event goes through its target attribute value’s ancestors in reverse tree order, and false otherwise
    * cancelable: True if event is cancellable, false otherwise.

Example:

    sj.tag('x-foo', {
        template: '<div sj-bind="this.gotEvent"></div>'
        events: {
            foo: function ($event) {
                this.gotEvent = $event.detail;
            }
        }
    });

    sj.fireEvent(document.querySelector('x-foo', 'foo', {detail:{hello: 'nick'}});

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

    <select sj-repeat="x in this.ary" sj-model="x.label">
        <option sj-value="x.value"></option>
    </select>

_this_ indicates custom element.

You can repeat over the object.

    <select sj-repeat="(key, value) in this.obj">
        <span sj-bind="key"></span>:<span sj-bind="value"></span>
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

## sj-bind

    <div sj-bind="<<EXPRESSION>>"></div>

This element's textContent will replaced by evaluation result of EXPRESSION.
In the expression, _this_ indicates your custom element.

## sj-src

    <iframe sj-src="<<EXPRESSION>>"></iframe>

You can specify the src for element via `sj-src` attribute.
In the expression, _this_ indicates your custom element.

## sj-value

    <option sj-value="<<EXPRESSION>>"></option>

You can specify the value for element via `sj-value` attribute.
In the expression, _this_ indicates your custom element.

## sj-href

    <a sj-href="<<EXPRESSION>>"></a>

You can specify the href for element via `sj-href` attribute.
In the expression, _this_ indicates your custom element.

If the eavaluation result contains unsafe url scheme, sj will sanitize it.

## `sj-attr-*`

    <div sj-attr-ATTR_NAME="<<EXPRESSION>>"></a>

`sj-attr-*` attribute compiled as attributes.

Example:

    <div sj-attr-data-foo="5963"></div>

Will be interpreted as:

    <div data-foo="5963"></div>

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

    make setup
    make
    make test

## FAQ

### Is there an angular's ng-bind-html?

No. But you can write a code like following.

    <div>
        <h2>Preview</h2>
        <div sj-app="PreviewApp">
            <textarea sj-model="this.html">Hello <B>John</B></textarea>
            <iframe sj-src="this.src()"></iframe>
        </div>
    </div>
    <script type="text/javascript">
        function PreviewApp() {
            this.src = function () {
                return "data:text/html," + encodeURIComponent(this.html);
            };
        }
    </script>

### Is there a `{{expr}}` form support?

No. It may cause security issue.

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
