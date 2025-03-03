REM see https://nodejs.org/api/module.html#import-from-https in NodeJs v22.9.0 documentation for HTTPS import
REM see https://nodejs.org/api/module.html#enabling in NodeJs v22.9.0 documentation for hook registration

set TZ=Europe/Rome
node --import ./src/node/__node__register-hooks.js --test test_e2e/**/*.test.js

pause