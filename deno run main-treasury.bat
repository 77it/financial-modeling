@echo off

IF [%1] == [] GOTO EXIT_WITH_ERROR__PCT1_IS_EMPTY

deno run --check --allow-net --allow-read --allow-write --allow-run %~dp0/src/main-treasury-temp.js --input %1 --output %1.trn_jsonl.tmp --errors main-treasury-temp.errors.txt

goto EXIT__END


:EXIT_WITH_ERROR__PCT1_IS_EMPTY

echo.
echo ERROR: first parameter is empty

:EXIT__END

pause
