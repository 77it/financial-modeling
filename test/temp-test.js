// deno --allow-sys

import prettier from 'prettier';

const code = `function(__ctx){ 'use strict'; return __mathOps.sub(__ensure(__mathOps.add(__ensure(__ref("a", __ctx)), __ensure(__mathOps.mul(__ensure(__ref("b", __ctx)), __ensure(__ref("c", __ctx)))))), __ensure(__mathOps.div(__ensure(__ref("d", __ctx)), __ensure(__ref("e", __ctx))))); }`;

// Format JavaScript code
const formatted = await prettier.format(`(${code})`, { parser: 'babel' });

console.log(formatted);
