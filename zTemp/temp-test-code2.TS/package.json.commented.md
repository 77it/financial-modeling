# a sample package.json

from https://github.com/microsoft/TypeScript-Node-Starter/blob/master/package.json

# mocha

## docs

Testing TypeScript with Mocha and Chai, 2019-08 https://42coders.com/testing-typescript-with-mocha-and-chai/

Official mocha TypeScript examples   https://github.com/mochajs/mocha-examples/tree/master/packages/typescript

## test location

write tests anywhere inside "/src" folder, naming test file with extension ".test.ts""

## install mocha, chai, etc

	npm install chai mocha ts-node @types/chai @types/mocha --save-dev

## edits to "package.json"

	"scripts": {
		"test": "mocha -r ts-node/register src/**/*.test.ts"
	},

## run test (from command line)

	npm run test

## other mocha docs

Run mocha excluding paths   https://stackoverflow.com/questions/34301448/run-mocha-excluding-paths/34733084#34733084

How to configure mocha to find all test files recursively?   https://stackoverflow.com/questions/49497509/how-to-configure-mocha-to-find-all-test-files-recursively

A quick and complete guide to Mocha testing   https://blog.logrocket.com/a-quick-and-complete-guide-to-mocha-testing-d0e0ea09f09d/
