ECHO bun as per 2025-03-03 doesn't support import from https
ECHO see https://github.com/oven-sh/bun/issues/38

bun test --preload ./src/bun/__bun__https_import_plugin.js --timeout 60000 test/

pause