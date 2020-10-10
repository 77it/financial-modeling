// run with
// deno run --allow-read --allow-write THIS.ts -i INPUT -o OUTPUT

import { ValuesA1, ValuesA2, ValuesB1, ValuesB2 } from "https://raw.githubusercontent.com/stefano77it/financial-modeling/master/temp-test-code/modules-v1/moduleA.ts";

console.log(ValuesA1.value + " " + ValuesA2.value + " " + ValuesB1.value + " " + ValuesB2.value);

