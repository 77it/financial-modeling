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

online test https://regex101.com/r/
*/

import {assert, assertFalse, assertEquals, assertNotEquals} from "https://deno.land/std/testing/asserts.ts";

// DRIVER, full string match
const DRIVER_REGEX = /^[_a-zA-Z]\w*$/g;
// $DRIVER, full string match
const $DRIVER_REGEX = /^\$[_a-zA-Z]\w*$/g;
// $.DRIVER, full string match
const $_DRIVER_REGEX = /^\$\.[_a-zA-Z]\w*$/g;
// $.$DRIVER, full string match
const $_$DRIVER_REGEX = /^\$\.\$[_a-zA-Z]\w*$/g;
// UNIT.DRIVER, full string match
const UNIT_DRIVER_REGEX = /^[_a-zA-Z]\w*?\.[_a-zA-Z]\w*$/g;

Deno.test("driver regex tests", () => {
    //#region DRIVER_REGEX
    const _DRIVER_REGEX_TEST_1 = "driver";
    const _DRIVER_REGEX_TEST_2 = "_driver";
    const _DRIVER_REGEX_TEST_3_KO = "9_driver";
    const _DRIVER_REGEX_TEST_4 = "a";
    const _DRIVER_REGEX_TEST_5 = "_";

    assertEquals(_DRIVER_REGEX_TEST_1.match(DRIVER_REGEX)?.[0], _DRIVER_REGEX_TEST_1);
    assertEquals(_DRIVER_REGEX_TEST_2.match(DRIVER_REGEX)?.[0], _DRIVER_REGEX_TEST_2);
    assertNotEquals(_DRIVER_REGEX_TEST_3_KO.match(DRIVER_REGEX)?.[0], _DRIVER_REGEX_TEST_3_KO);
    assertEquals(_DRIVER_REGEX_TEST_4.match(DRIVER_REGEX)?.[0], _DRIVER_REGEX_TEST_4);
    assertEquals(_DRIVER_REGEX_TEST_5.match(DRIVER_REGEX)?.[0], _DRIVER_REGEX_TEST_5);
    //#endregion

    //#region $DRIVER_REGEX
    const _$DRIVER_REGEX_TEST_1 = "$driver";

    assertEquals(_$DRIVER_REGEX_TEST_1.match($DRIVER_REGEX)?.[0], _$DRIVER_REGEX_TEST_1);
    //#endregion

    //#region $_DRIVER_REGEX
    const _$_DRIVER_REGEX_REGEX_TEST_1 = "$.driver";

    assertEquals(_$_DRIVER_REGEX_REGEX_TEST_1.match($_DRIVER_REGEX)?.[0], _$_DRIVER_REGEX_REGEX_TEST_1);
    //#endregion

    //#region $_$DRIVER_REGEX
    const _$_$DRIVER_REGEX_REGEX_TEST_1 = "$.$driver";

    assertEquals(_$_$DRIVER_REGEX_REGEX_TEST_1.match($_$DRIVER_REGEX)?.[0], _$_$DRIVER_REGEX_REGEX_TEST_1);
    //#endregion

    //#region UNIT_DRIVER
    const _UNIT_DRIVER_REGEX_REGEX_TEST_1 = "unit.driver";

    assertEquals(_UNIT_DRIVER_REGEX_REGEX_TEST_1.match(UNIT_DRIVER_REGEX)?.[0], _UNIT_DRIVER_REGEX_REGEX_TEST_1);
    //#endregion
});
