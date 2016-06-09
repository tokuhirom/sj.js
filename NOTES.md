# Why sj.js doesn't use Proxy?

Proxy is not supported on safari. And proxy polyfill doens't work on safari.

https://github.com/GoogleChrome/proxy-polyfill

Following code won't work@20160609.

    var x;
    var p = new Proxy({}, {set: function (target, value) {
        x = 1;
        return;
    }});
    assert(x === 1);

