// run with `deno test THIS-FILE-NAME`

// driver naming standard
/*
Unit and Drivers must:
* contain only numbers, letters and _
* start with letters and _
* Unit can be a single $ (means Simulation)
* Immutable Drivers start with $

regex
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes  // see \w (word) regex definition
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Quantifiers
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet

Online evaluator/explainer: https://regex101.com/r/    // select Javascript! (if needed)
Graphical regex diagram: https://regexper.com/
*/

import {assert, assertFalse, assertEquals, assertNotEquals} from "https://deno.land/std/testing/asserts.ts";

// DRIVER, full string match
const DRIVER_REGEX = /^[_a-zA-Z]\w*$/;
// $DRIVER, full string match
const $DRIVER_REGEX = /^\$[_a-zA-Z]\w*$/;
// $.DRIVER, full string match
const $_DRIVER_REGEX = /^\$\.[_a-zA-Z]\w*$/;
// $.$DRIVER, full string match
const $_$DRIVER_REGEX = /^\$\.\$[_a-zA-Z]\w*$/;
// UNIT.DRIVER, full string match
const UNIT_DRIVER_REGEX = /^[_a-zA-Z]\w*?\.[_a-zA-Z]\w*$/;

Deno.test("driver regex tests", () => {
    //#region DRIVER_REGEX
    const _DRIVER_REGEX_TEST_1 = "DrIvEr";
    const _DRIVER_REGEX_TEST_2 = "_dri_ver";
    const _DRIVER_REGEX_TEST_3_KO1 = "9_driver";
    const _DRIVER_REGEX_TEST_3_KO2 = "$";
    const _DRIVER_REGEX_TEST_4 = "a";
    const _DRIVER_REGEX_TEST_5 = "_";

    assert(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_1));
    assert(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_2));
    assertFalse(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_3_KO1));
    assertFalse(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_3_KO2));
    assert(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_4));
    assert(DRIVER_REGEX.test(_DRIVER_REGEX_TEST_5));
    //#endregion

    //#region $DRIVER_REGEX
    const _$DRIVER_REGEX_TEST_1 = "$driver";

    assert($DRIVER_REGEX.test(_$DRIVER_REGEX_TEST_1));
    //#endregion

    //#region $_DRIVER_REGEX
    const _$_DRIVER_REGEX_REGEX_TEST_1 = "$.driver";

    assert($_DRIVER_REGEX.test(_$_DRIVER_REGEX_REGEX_TEST_1));
    //#endregion

    //#region $_$DRIVER_REGEX
    const _$_$DRIVER_REGEX_REGEX_TEST_1 = "$.$driver";

    assert($_$DRIVER_REGEX.test(_$_$DRIVER_REGEX_REGEX_TEST_1));
    //#endregion

    //#region UNIT_DRIVER
    const _UNIT_DRIVER_REGEX_REGEX_TEST_1 = "unit.driver";

    assert(UNIT_DRIVER_REGEX.test(_UNIT_DRIVER_REGEX_REGEX_TEST_1));
    //#endregion
});
