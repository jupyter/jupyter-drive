define(["require", "exports", "module1"], function (require, exports, m1) {
    var module2;
    (function (module2) {
        function bar() {
            return String(m1.foo);
        }
        module2.bar = bar;
    })(module2 = exports.module2 || (exports.module2 = {}));
});
