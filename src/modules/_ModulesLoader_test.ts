// run with `deno test --allow-read --allow-net THIS-FILE-NAME`

import {assert, assertFalse, assertEquals, assertNotEquals} from "https://deno.land/std/testing/asserts.ts";

import {ModulesLoader} from "./_ModulesLoader.js";
import {ModuleData} from "./_ModuleData.js";

class ValuesB2 {
    valueX;

    constructor(value: any) {
        this.valueX = value;
    }
}

const modulesLoader = new ModulesLoader();

Deno.test("test addClassFromObject, class defined here", () => {
    const _URI = "";
    assert(modulesLoader.addClassFromObject({moduleName: "ValuesB2X", moduleEngineURI: _URI, classObj: ValuesB2}).success);

    const query = modulesLoader.get({moduleName: "ValuesB2X", moduleEngineURI: _URI});
    assert(query != undefined);

    const _ValuesB2X = query.class;
    const __ValuesB2X = new _ValuesB2X(8888)
    assertEquals(__ValuesB2X.valueX, 8888);
    assertEquals(_URI, query.cdnURI);
});

Deno.test("test addClassFromURI, alongside module", async () => {
    const _URI = "./_ModulesLoader_test_module.js";
    assert((await modulesLoader.addClassFromURI({moduleName: "ValuesB", moduleEngineURI: _URI})).success);

    const query = modulesLoader.get({moduleName: "ValuesB", moduleEngineURI: _URI});
    assert(query != undefined);

    const _ValuesB = query.class;
    const __ValuesB = new _ValuesB({value: 9999, value2: "bbb"});
    assertEquals(__ValuesB.value, 9999);
    assertEquals(__ValuesB.value2, "bbb");
    assertEquals(_URI, query.cdnURI);
});

Deno.test("test addClassFromURI, online module", async () => {
    const _URI = "https://cdn.jsdelivr.net/gh/77it/financial-modeling@0.1.11/src/modules/z_test_module.js";
    assert((await modulesLoader.addClassFromURI({moduleName: "ValuesB2", moduleEngineURI: _URI})).success);

    const query = modulesLoader.get({moduleName: "ValuesB2", moduleEngineURI: _URI});
    assert(query != undefined);

    const _ValuesB2 = query.class;
    const __ValuesB2 = new _ValuesB2({value: 9999, value2: "bbb"});
    assertEquals(__ValuesB2.value, 9999);
    assertEquals(__ValuesB2.value2, "bbb");
    assertEquals(_URI, query.cdnURI);
});

Deno.test("test addClassFromURI, adding '.js' extension", async () => {
    const _URI = "./_ModulesLoader_test_module";
    assert((await modulesLoader.addClassFromURI({moduleName: "ValuesB", moduleEngineURI: _URI})).success);

    const query = modulesLoader.get({moduleName: "ValuesB", moduleEngineURI: _URI});
    assert(query != undefined);

    const _ValuesB = query.class;
    const __ValuesB = new _ValuesB({value: 9999, value2: "bbb"});
    assertEquals(__ValuesB.value, 9999);
    assertEquals(__ValuesB.value2, "bbb");
    assertEquals(`${_URI}.js`, query.cdnURI);
});

Deno.test("test addClassFromURI, empty URI", async () => {
    const _URI = "  ";
    const _moduleName = "_ModulesLoader_test_module";
    assert((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _URI})).success);

    const query = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI});
    assert(query != undefined);

    const _ValuesB = query.class;
    const __ValuesB = new _ValuesB({value: 9999, value2: "bbb"});
    assertEquals(__ValuesB.value, 9999);
    assertEquals(__ValuesB.value2, "bbb");
    assertEquals(`./${_moduleName}.js`, query.cdnURI);

    //#region test other URI cases
    const _URI_backslash = " \\ ";
    assert((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _URI_backslash})).success);
    const query_backslash = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI_backslash});
    assert(query_backslash != undefined);
    assertEquals(`./${_moduleName}.js`, query_backslash.cdnURI);

    const _URI_slash = " \/ ";
    assert((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _URI_slash})).success);
    const query_slash = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI_slash});
    assert(query_slash != undefined);
    assertEquals(`./${_moduleName}.js`, query_slash.cdnURI);

    const _URI_dot = " . ";
    assert((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _URI_dot})).success);
    const query_dot = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI_dot});
    assert(query_dot != undefined);
    assertEquals(`./${_moduleName}.js`, query_dot.cdnURI);
    //#endregion
});

Deno.test("test add from class, get it, and then from uri (skipped for same name), then get the first class", async () => {
    const _URI = "./_ModulesLoader_test_module.js";
    const _moduleName = "duplicateModule";

    // test add from class
    assert(modulesLoader.addClassFromObject({moduleName: _moduleName, moduleEngineURI: _URI, classObj: ValuesB2}).success);

    // get the class
    const query = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI});
    assert(query != undefined);
    const _ValuesB = query.class;
    const __ValuesB = new _ValuesB(9999);
    assertEquals(__ValuesB.valueX, 9999);

    // add from uri (skipped for same name)
    assertFalse((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _URI})).success);

    // get the first class
    const query2 = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _URI});
    assert(query2 != undefined);
    const _ValuesB2 = query.class;
    const __ValuesB2 = new _ValuesB2(9999);
    assertEquals(__ValuesB2.valueX, 9999);
});

Deno.test("test addClassFromURI, GitHub URI transformation to CDN", async () => {
    const _moduleName = "moduleXYZ";
    // list generated using this tool: https://www.jsdelivr.com/github
    const _list = [
        {uri: 'https://github.com/77it/financial-modeling/blob/v0.1.11/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js'},
        {uri: 'https://github.com/77it/financial-modeling/blob/master/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling@master/src/modules/z_test_module.js'},
        {uri: 'https://github.com/77it/financial-modeling/blob/latest/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling/src/modules/z_test_module.js'},
        {uri: 'https://raw.githubusercontent.com/77it/financial-modeling/v0.1.11/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling@v0.1.11/src/modules/z_test_module.js'},
        {uri: 'https://raw.githubusercontent.com/77it/financial-modeling/master/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling@master/src/modules/z_test_module.js'},
        {uri: 'https://raw.githubusercontent.com/77it/financial-modeling/latest/src/modules/z_test_module.js', cdn: 'https://cdn.jsdelivr.net/gh/77it/financial-modeling/src/modules/z_test_module.js'},
    ];

    for (const _entry of _list){
        //console.log(`DEBUG: testing ${_entry.uri}`)
        assert((await modulesLoader.addClassFromURI({moduleName: _moduleName, moduleEngineURI: _entry.uri})).success);
        const query = modulesLoader.get({moduleName: _moduleName, moduleEngineURI: _entry.uri});
        assert(query != undefined);
        assertEquals(_entry.cdn, query.cdnURI);
    }
});

xxx; // testa fallimento import per URI non esistente

xxx; // testa caricamento modulo da ModuleData

xxx; // inserisci nota su ModuleLoader: ModuleName a che serve? e URI? se ci sono ModuleName duplicati? e URI duplicati?
