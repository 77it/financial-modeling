// run with `deno test THIS-FILE-NAME`

import { assert, assertFalse, assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";

import { ModulesRunner } from "./modules_runner.js";

class ValuesB2 {
	valueX;

	constructor(value: any) {
		this.valueX = value;
	}
}

const modulesRunner = new ModulesRunner();

Deno.test("test addClassFromURI, alongside module", async () => {
	assert(await modulesRunner.addClassFromURI({moduleName: "ValuesB", URI: "./z_test_module.js"}));

	const _ValuesB = modulesRunner.getClass({moduleName: "ValuesB", URI: "./z_test_module.js"});
	const __ValuesB = new _ValuesB({value: 9999, value2: "bbb"});
	assertEquals(__ValuesB.value, 9999);
	assertEquals(__ValuesB.value2, "bbb");
});

Deno.test("test addClassFromURI, online module", async () => {
	assert(await modulesRunner.addClassFromURI({moduleName: "ValuesB2", URI: "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.8/simulation001/z-todelete/dynamicimport2.js"}));

	const _ValuesB2 = modulesRunner.getClass({moduleName: "ValuesB2", URI: "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.8/simulation001/z-todelete/dynamicimport2.js"})
	const __ValuesB2 = new _ValuesB2({value: 9999, value2: "bbb"});
	assertEquals(__ValuesB2.value, 9999);
	assertEquals(__ValuesB2.value2, "bbb");
});

Deno.test("test addClassesFromURI, online module", async () => {
	const _p = [
		{moduleName: "ValuesB2a", URI: "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.8/simulation001/z-todelete/dynamicimport2.js"},
		{moduleName: "ValuesB2b", URI: "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.8/simulation001/z-todelete/dynamicimport2.js"}
	];

	assert(await modulesRunner.addClassesFromURI(_p));

	const _ValuesB2a = modulesRunner.getClass({moduleName: "ValuesB2a", URI: "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.8/simulation001/z-todelete/dynamicimport2.js"})
	const __ValuesB2a = new _ValuesB2a({value: 9999, value2: "bbb"});
	assertEquals(__ValuesB2a.value, 9999);
	assertEquals(__ValuesB2a.value2, "bbb");
});

Deno.test("test addClassFromObject, class defined here", () => {
	assert(modulesRunner.addClassFromObject({moduleName: "ValuesB2X", URI: "", classObj: ValuesB2}));

	const _ValuesB2X = modulesRunner.getClass({moduleName: "ValuesB2X", URI: ""})
	const __ValuesB2X = new _ValuesB2X(8888)
	assertEquals(__ValuesB2X.valueX, 8888);
});

