import m1 = require("module1");



export module module2 {

    export function bar():string{
        return String(m1.foo);

    }
}
