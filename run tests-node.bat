REM see https://nodejs.org/api/esm.html#https-and-http-imports for --experimental-network-imports option

node --experimental-network-imports --test **/deno_node*test.js **/node*test.js **/test/**/*test.js

pause