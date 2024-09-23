REM see https://nodejs.org/api/module.html#import-from-https in NodeJs v22.9.0 documentation for HTTPS import
REM see https://nodejs.org/api/module.html#enabling in NodeJs v22.9.0 documentation for hook registration

node --import ./src/node/__node__register-hooks.js --test **/deno_node*test.js **/node*test.js **/test/**/*__test.js

pause