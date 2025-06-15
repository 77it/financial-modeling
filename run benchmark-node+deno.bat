@echo off
setlocal

REM see https://nodejs.org/api/module.html#import-from-https in NodeJs v22.9.0 documentation for HTTPS import
REM see https://nodejs.org/api/module.html#enabling in NodeJs v22.9.0 documentation for hook registration

REM Prompt user for the file to test
set /p FILE=Enter the path to the JavaScript file to test: 

:loop
echo.
echo NODEJS run
echo.

node --import ./src/node/__node__register-hooks.js "%FILE%"
echo.

echo DENO run
echo.

deno run --allow-read --allow-write --allow-net --allow-import "%FILE%"
echo.

echo Press Enter to run again or close this window to exit:
pause >nul
goto loop
