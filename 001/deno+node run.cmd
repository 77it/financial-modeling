@echo off

echo.
echo DENO running...
deno run --allow-net --config ./deno.json ./main.js
echo.
pause

echo.
echo.
echo NODE running...
node --experimental-loader ./https-loader.mjs ./main.js

echo.
pause

echo.
echo SUCCESS, END
pause
exit %errorlevel%
