@echo off

echo.
echo DENO running...
deno run --allow-net --config ./deno.json ./main.js
echo.
pause

echo.
echo END
pause
exit %errorlevel%
